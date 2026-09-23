<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useGroupStore } from '@/stores/groupStore'
import { useGameStore } from '@/stores/gameStore'
import { useToastStore } from '@/stores/toastStore'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import type { Game } from '@/domain/entities/Game'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const groupStore = useGroupStore()
const gameStore = useGameStore()
const toastStore = useToastStore()

const ready = ref(false)
const validationError = ref<string | null>(null)
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
}

async function submit() {
  validationError.value = null
  const groupId = groupStore.activeGroupId
  const minPlayers = Number(form.minPlayers)
  const maxPlayers = Number(form.maxPlayers)

  if (!groupId || !canManage.value) return
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
    bggId: null,
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
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <LoadingState v-if="!ready || gameStore.loading && isEditing" label="Loading game editor…" />
    <ErrorState v-else-if="gameStore.error && isEditing && !gameStore.currentGame" :message="gameStore.error" @retry="initialize" />
    <ErrorState v-else-if="!canManage" message="Only table owners and organizers can manage the game library." :retryable="false" />

    <template v-else>
      <PageHeader :title="isEditing ? 'Edit game' : 'Add a game'" :description="isEditing ? 'Update this title on your table’s shelf.' : 'Add a title your group can choose for future events.'" />
      <form class="space-y-6 rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8" @submit.prevent="submit">
        <div v-if="validationError" class="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200" role="alert">{{ validationError }}</div>
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
