<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useGroupStore } from '@/stores/groupStore'
import { useAuthStore } from '@/stores/authStore'
import GameCard from '@/components/game/GameCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const gameStore = useGameStore()
const groupStore = useGroupStore()
const authStore = useAuthStore()
const search = ref('')
const availability = ref<'all' | 'available' | 'unavailable'>('all')
const complexity = ref<'all' | 'light' | 'medium' | 'heavy'>('all')

const memberRole = computed(() => groupStore.members.find((member) => member.userId === authStore.user?.id)?.role)
const canManage = computed(() => memberRole.value === 'owner' || memberRole.value === 'organizer')
const filteredGames = computed(() => {
  const term = search.value.trim().toLowerCase()
  return gameStore.games.filter((game) => {
    const matchesSearch = !term || [game.name, game.description ?? '', ...game.category].some((value) => value.toLowerCase().includes(term))
    const matchesAvailability = availability.value === 'all' || game.isAvailable === (availability.value === 'available')
    const matchesComplexity = complexity.value === 'all' || game.complexity === complexity.value
    return matchesSearch && matchesAvailability && matchesComplexity
  })
})

function loadGames() {
  if (groupStore.activeGroupId) void Promise.all([
    gameStore.fetchGames(groupStore.activeGroupId),
    groupStore.fetchMembers(groupStore.activeGroupId)
  ])
}

watch(() => groupStore.activeGroupId, loadGames, { immediate: true })
</script>

<template>
  <div>
    <PageHeader title="Game library" :description="`${gameStore.games.length} ${gameStore.games.length === 1 ? 'game' : 'games'} on ${groupStore.activeGroup?.name ?? 'your table'}'s shelf.`">
      <template #actions>
        <AppButton v-if="canManage" @click="$router.push('/games/new')">Add game</AppButton>
      </template>
    </PageHeader>

    <LoadingState v-if="gameStore.loading" label="Loading your game shelf…" />

    <ErrorState v-else-if="gameStore.error" :message="gameStore.error" @retry="loadGames" />

    <EmptyState v-else-if="gameStore.games.length === 0" icon="◌" title="Your shelf is ready" description="Add the first game your group can choose for an event.">
      <template v-if="canManage" #actions><AppButton @click="$router.push('/games/new')">Add your first game</AppButton></template>
    </EmptyState>

    <template v-else>
      <section class="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-[#181d27] p-4 sm:grid-cols-[1fr_auto_auto]" aria-label="Game filters">
        <input v-model="search" type="search" class="app-field text-sm" placeholder="Search games, descriptions, or categories" aria-label="Search games">
        <select v-model="availability" class="app-field text-sm" aria-label="Filter by availability"><option value="all">All availability</option><option value="available">Available</option><option value="unavailable">Unavailable</option></select>
        <select v-model="complexity" class="app-field text-sm" aria-label="Filter by complexity"><option value="all">All complexity</option><option value="light">Light</option><option value="medium">Medium</option><option value="heavy">Heavy</option></select>
      </section>

      <EmptyState v-if="filteredGames.length === 0" icon="⌕" title="No games match" description="Try a different search or clear one of the filters." />

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <GameCard
        v-for="game in filteredGames"
        :key="game.id"
        :game="game"
      />
      </div>
    </template>
  </div>
</template>
