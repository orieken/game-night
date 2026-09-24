<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useGroupStore } from '@/stores/groupStore'
import { useGameStore } from '@/stores/gameStore'
import { useGameCatalogStore } from '@/stores/gameCatalogStore'
import { useToastStore } from '@/stores/toastStore'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import type { Game } from '@/domain/entities/Game'
import type { GameCatalogReference, GameCatalogSummary } from '@/domain/entities/GameCatalog'
import { hasBggDuplicate, mapCatalogDetailsToGameDraft } from '@/domain/gameCatalogImport'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const groupStore = useGroupStore()
const gameStore = useGameStore()
const catalogStore = useGameCatalogStore()
const toastStore = useToastStore()

const ready = ref(false)
const validationError = ref<string | null>(null)
const catalogQuery = ref('')
const selectedCatalog = ref<GameCatalogReference | null>(null)
const selectingBggId = ref<number | null>(null)
let searchTimer: number | null = null
const gameId = computed(() => typeof route.params.id === 'string' ? route.params.id : null)
const isEditing = computed(() => Boolean(gameId.value))
const memberRole = computed(() => groupStore.members.find((member) => member.userId === authStore.user?.id)?.role)
const canManage = computed(() => memberRole.value === 'owner' || memberRole.value === 'organizer')

const form = reactive({
  name: '',
  description: '',
  minPlayers: 2 as number | null,
  maxPlayers: 4 as number | null,
  avgDuration: null as number | null,
  complexity: '' as '' | NonNullable<Game['complexity']>,
  categories: '',
  imageUrl: '',
  isAvailable: true
})

async function initialize() {
  ready.value = false
  validationError.value = null
  const groupId = groupStore.activeGroupId
  if (!groupId) return

  await groupStore.fetchMembers(groupId)
  if (gameId.value) {
    await gameStore.fetchGameById(groupId, gameId.value)
    if (gameStore.currentGame) populateForm(gameStore.currentGame)
  } else {
    await gameStore.fetchGames(groupId)
    resetForm()
  }
  ready.value = true
}

function populateForm(game: Game) {
  form.name = game.name
  form.description = game.description ?? ''
  form.minPlayers = game.minPlayers
  form.maxPlayers = game.maxPlayers
  form.avgDuration = game.avgDuration
  form.complexity = game.complexity ?? ''
  form.categories = game.category.join(', ')
  form.imageUrl = game.imageUrl ?? ''
  form.isAvailable = game.isAvailable
  selectedCatalog.value = game.catalogData
}

function resetForm() {
  form.name = ''
  form.description = ''
  form.minPlayers = 2
  form.maxPlayers = 4
  form.avgDuration = null
  form.complexity = ''
  form.categories = ''
  form.imageUrl = ''
  form.isAvailable = true
  selectedCatalog.value = null
  catalogQuery.value = ''
  catalogStore.clear()
}

async function selectCatalogGame(result: GameCatalogSummary) {
  if (hasBggDuplicate(gameStore.games, result.bggId)) {
    validationError.value = `${result.name} is already in this table's library.`
    return
  }

  validationError.value = null
  selectingBggId.value = result.bggId
  const details = await catalogStore.getDetails(result.bggId)
  selectingBggId.value = null
  if (!details) return

  const draft = mapCatalogDetailsToGameDraft(details)
  selectedCatalog.value = draft.catalogData
  form.name = draft.name
  form.description = draft.description
  form.minPlayers = draft.minPlayers
  form.maxPlayers = draft.maxPlayers
  form.avgDuration = draft.avgDuration
  form.complexity = draft.complexity ?? ''
  form.categories = draft.categories
  form.imageUrl = draft.imageUrl
  catalogStore.clear()
}

function useManualEntry() {
  selectedCatalog.value = null
  catalogQuery.value = ''
  catalogStore.clear()
}

async function submit() {
  validationError.value = null
  const groupId = groupStore.activeGroupId
  const minPlayers = Number(form.minPlayers)
  const maxPlayers = Number(form.maxPlayers)

  if (!groupId || !canManage.value) return
  if (!isEditing.value && selectedCatalog.value && hasBggDuplicate(gameStore.games, selectedCatalog.value.bggId)) {
    validationError.value = 'This BoardGameGeek title is already in your table library.'
    return
  }
  if (!Number.isFinite(minPlayers) || !Number.isFinite(maxPlayers) || minPlayers < 1 || maxPlayers < minPlayers) {
    validationError.value = 'Maximum players must be at least the minimum, and both must be positive.'
    return
  }

  const data = {
    name: form.name.trim(),
    description: form.description.trim() || null,
    minPlayers,
    maxPlayers,
    avgDuration: form.avgDuration ? Number(form.avgDuration) : null,
    complexity: form.complexity || null,
    category: form.categories.split(',').map((category) => category.trim()).filter(Boolean),
    imageUrl: form.imageUrl.trim() || null,
    bggId: selectedCatalog.value?.bggId ?? null,
    catalogData: selectedCatalog.value,
    isAvailable: form.isAvailable
  }

  const saved = isEditing.value && gameId.value
    ? await gameStore.updateGame(groupId, gameId.value, data)
    : await gameStore.createGame(groupId, data)

  if (saved) {
    toastStore.show(isEditing.value ? 'Game updated.' : 'Game added to the library.', 'success')
    await router.push(`/games/${saved.id}`)
  } else {
    toastStore.show(gameStore.error ?? 'Unable to save the game.', 'error')
  }
}

watch([() => groupStore.activeGroupId, gameId], () => void initialize(), { immediate: true })

watch(catalogQuery, (query) => {
  if (searchTimer) globalThis.clearTimeout(searchTimer)
  if (isEditing.value || query.trim().length < 3) {
    catalogStore.clear()
    return
  }
  searchTimer = globalThis.setTimeout(() => void catalogStore.search(query), 400)
})

onUnmounted(() => {
  if (searchTimer) globalThis.clearTimeout(searchTimer)
})
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <LoadingState v-if="!ready || gameStore.loading && isEditing" label="Loading game editor…" />
    <ErrorState v-else-if="gameStore.error && isEditing && !gameStore.currentGame" :message="gameStore.error" @retry="initialize" />
    <ErrorState v-else-if="!canManage" message="Only table owners and organizers can manage the game library." :retryable="false" />

    <template v-else>
      <PageHeader :title="isEditing ? 'Edit game' : 'Add a game'" :description="isEditing ? 'Update this title on your table’s shelf.' : 'Add a title your group can choose for future events.'" />

      <section v-if="!isEditing" class="mb-6 rounded-2xl border border-[#8b5cf6]/25 bg-[#8b5cf6]/5 p-5 sm:p-6" aria-labelledby="catalog-search-heading">
        <div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 id="catalog-search-heading" class="font-bold text-white">Find it on BoardGameGeek</h2>
            <p class="mt-1 text-sm text-slate-400">Search by title to prefill the game details, or continue with manual entry below.</p>
          </div>
          <a href="https://boardgamegeek.com/" target="_blank" rel="noreferrer" class="text-xs font-semibold text-[#57d2a4] hover:text-[#85e4c3]">Powered by BoardGameGeek</a>
        </div>
        <div class="mt-4">
          <label for="catalog-search" class="app-label">Board game title</label>
          <input id="catalog-search" v-model="catalogQuery" type="search" class="app-field" placeholder="Try Catan, Pandemic, or Agricola" autocomplete="off">
        </div>
        <p v-if="catalogStore.loading && selectingBggId === null" class="mt-3 text-sm text-slate-300" role="status">Searching BoardGameGeek…</p>
        <p v-else-if="catalogStore.error" class="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100" role="alert">{{ catalogStore.error }}</p>
        <p v-else-if="catalogQuery.trim().length >= 3 && !catalogStore.results.length" class="mt-3 text-sm text-slate-400">No matches yet. You can continue entering the game manually.</p>
        <ul v-if="catalogStore.results.length" class="mt-4 grid gap-3" aria-label="BoardGameGeek search results">
          <li v-for="result in catalogStore.results" :key="result.bggId">
            <button type="button" class="flex min-h-20 w-full items-center gap-4 rounded-xl border border-white/10 bg-[#181d27] p-3 text-left transition hover:border-[#57d2a4]/50 hover:bg-[#222938]" :disabled="selectingBggId !== null" @click="selectCatalogGame(result)">
              <img v-if="result.thumbnailUrl" :src="result.thumbnailUrl" alt="" class="h-16 w-16 shrink-0 rounded-lg object-cover">
              <span v-else class="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-white/5 text-2xl" aria-hidden="true">◇</span>
              <span class="min-w-0 flex-1">
                <strong class="block truncate text-white">{{ result.name }}</strong>
                <span class="mt-1 block text-xs text-slate-400">
                  {{ result.yearPublished ?? 'Year unknown' }}
                  <template v-if="result.minPlayers"> · {{ result.minPlayers }}–{{ result.maxPlayers ?? result.minPlayers }} players</template>
                  <template v-if="result.playingTimeMinutes"> · {{ result.playingTimeMinutes }} min</template>
                </span>
              </span>
              <span class="text-sm font-semibold text-[#57d2a4]">{{ selectingBggId === result.bggId ? 'Importing…' : 'Use game' }}</span>
            </button>
          </li>
        </ul>
      </section>

      <form class="space-y-6 rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8" @submit.prevent="submit">
        <div v-if="validationError" class="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200" role="alert">{{ validationError }}</div>
        <div v-if="selectedCatalog" class="flex flex-col justify-between gap-3 rounded-xl border border-[#57d2a4]/25 bg-[#57d2a4]/5 p-4 sm:flex-row sm:items-center">
          <p class="text-sm text-slate-200">Imported from <a :href="selectedCatalog.sourceUrl" target="_blank" rel="noreferrer" class="font-semibold text-[#57d2a4] hover:text-[#85e4c3]">BoardGameGeek</a>. Your saved record keeps the original source details.</p>
          <AppButton v-if="!isEditing" type="button" variant="ghost" @click="useManualEntry">Clear import</AppButton>
        </div>
        <AppInput id="game-name" v-model="form.name" label="Game name" placeholder="Azul" required />
        <div>
          <label for="game-description" class="app-label">Description</label>
          <textarea id="game-description" v-model="form.description" rows="4" class="app-field" placeholder="What makes this game worth bringing to the table?"></textarea>
        </div>
        <div class="grid gap-4 sm:grid-cols-3">
          <AppInput id="min-players" v-model.number="form.minPlayers" type="number" label="Minimum players" required />
          <AppInput id="max-players" v-model.number="form.maxPlayers" type="number" label="Maximum players" required />
          <AppInput id="duration" v-model.number="form.avgDuration" type="number" label="Duration in minutes" placeholder="Optional" />
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="complexity" class="app-label">Complexity</label>
            <select id="complexity" v-model="form.complexity" class="app-field">
              <option value="">Not specified</option><option value="light">Light</option><option value="medium">Medium</option><option value="heavy">Heavy</option>
            </select>
          </div>
          <AppInput id="categories" v-model="form.categories" label="Categories" placeholder="Strategy, Tile laying" />
        </div>
        <AppInput id="image-url" v-model="form.imageUrl" type="url" label="Image URL" placeholder="Optional" />
        <label class="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300"><input v-model="form.isAvailable" type="checkbox" class="h-5 w-5 rounded border-white/20 bg-[#10131a] text-[#8b5cf6]">Available to play</label>
        <div class="flex justify-end gap-3 border-t border-white/10 pt-5">
          <AppButton type="button" variant="secondary" @click="router.back()">Cancel</AppButton>
          <AppButton type="submit" :loading="gameStore.loading">{{ isEditing ? 'Save changes' : 'Add game' }}</AppButton>
        </div>
      </form>
    </template>
  </div>
</template>
