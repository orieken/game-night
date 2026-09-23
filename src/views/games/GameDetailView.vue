<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useGroupStore } from '@/stores/groupStore'
import { useAuthStore } from '@/stores/authStore'
import AppButton from '@/components/common/AppButton.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const route = useRoute()
const gameStore = useGameStore()
const groupStore = useGroupStore()
const authStore = useAuthStore()
const memberRole = computed(() => groupStore.members.find((member) => member.userId === authStore.user?.id)?.role)
const canManage = computed(() => memberRole.value === 'owner' || memberRole.value === 'organizer')

function loadGame() {
  const groupId = groupStore.activeGroupId
  const gameId = route.params.id
  if (groupId && typeof gameId === 'string') void Promise.all([
    gameStore.fetchGameById(groupId, gameId),
    groupStore.fetchMembers(groupId)
  ])
}

watch([() => groupStore.activeGroupId, () => route.params.id], loadGame, { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <LoadingState v-if="gameStore.loading" label="Loading game details…" />

    <ErrorState v-else-if="gameStore.error" :message="gameStore.error" @retry="loadGame" />

    <template v-else-if="gameStore.currentGame">
      <PageHeader :title="gameStore.currentGame.name" description="Game details and availability for the active table.">
        <template #actions>
          <AppButton variant="secondary" @click="$router.push('/games')">Back to library</AppButton>
          <AppButton v-if="canManage" @click="$router.push(`/games/${gameStore.currentGame?.id}/edit`)">Edit game</AppButton>
        </template>
      </PageHeader>

      <div class="app-surface overflow-hidden rounded-3xl shadow-xl shadow-black/10">
      <div class="relative h-64 bg-[#222938] sm:h-80">
        <img
          v-if="gameStore.currentGame.imageUrl"
          :src="gameStore.currentGame.imageUrl"
          :alt="gameStore.currentGame.name"
          class="w-full h-full object-cover"
        />
        <div v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#292047] to-[#1b2630] text-[#57d2a4]">
          <span class="text-6xl" aria-hidden="true">◇</span>
        </div>
      </div>

      <div class="p-8">
        <div class="mb-6 flex flex-wrap gap-2">
          <span v-for="cat in gameStore.currentGame.category" :key="cat" class="rounded-full border border-[#8b5cf6]/25 bg-[#8b5cf6]/10 px-3 py-1 text-sm text-[#c4b5fd]">
            {{ cat }}
          </span>
          <div v-if="gameStore.currentGame.category.length === 0" class="text-sm text-slate-500">No categories assigned</div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div class="rounded-xl bg-[#10131a]/60 p-4 text-center">
            <div class="mb-1 text-sm text-slate-400">Players</div>
            <div class="text-xl font-bold">{{ gameStore.currentGame.minPlayers }}-{{ gameStore.currentGame.maxPlayers }}</div>
          </div>
          <div class="rounded-xl bg-[#10131a]/60 p-4 text-center">
            <div class="mb-1 text-sm text-slate-400">Duration</div>
            <div class="text-xl font-bold">{{ gameStore.currentGame.avgDuration || '?' }}m</div>
          </div>
          <div class="rounded-xl bg-[#10131a]/60 p-4 text-center">
            <div class="mb-1 text-sm text-slate-400">Complexity</div>
            <div class="text-xl font-bold capitalize">{{ gameStore.currentGame.complexity || '-' }}</div>
          </div>
          <div class="rounded-xl bg-[#10131a]/60 p-4 text-center">
            <div class="mb-1 text-sm text-slate-400">Status</div>
            <div class="text-xl font-bold" :class="gameStore.currentGame.isAvailable ? 'text-green-400' : 'text-red-400'">
              {{ gameStore.currentGame.isAvailable ? 'Available' : 'Unavailable' }}
            </div>
          </div>
        </div>

        <div class="prose prose-invert max-w-none">
          <h3 class="mb-2 text-lg font-bold">About the game</h3>
          <p class="leading-relaxed text-slate-300">
            {{ gameStore.currentGame.description || 'No description available.' }}
          </p>
        </div>
      </div>
    </div>
    </template>

    <EmptyState v-else icon="?" title="Game not found" description="This game may have been removed or may belong to another table.">
      <template #actions>
        <AppButton variant="secondary" @click="$router.push('/games')">Back to library</AppButton>
      </template>
    </EmptyState>
  </div>
</template>
