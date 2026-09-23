<script setup lang="ts">
import { watch } from 'vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { useAuthStore } from '@/stores/authStore'
import { useGroupStore } from '@/stores/groupStore'
import { useLeaderboardStore } from '@/stores/leaderboardStore'

const authStore = useAuthStore()
const groupStore = useGroupStore()
const store = useLeaderboardStore()

async function loadLeaderboard() {
  if (groupStore.activeGroupId) await store.fetchLeaderboard(groupStore.activeGroupId)
}

watch(() => groupStore.activeGroupId, () => void loadLeaderboard(), { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-5xl">
    <PageHeader
      eyebrow="Table standings"
      title="Leaderboard"
      description="Wins and participation points from completed game sessions."
    />

    <div class="mb-6 rounded-2xl border border-[#57d2a4]/15 bg-[#57d2a4]/5 px-5 py-4 text-sm text-slate-300">
      A win earns 3 points; every other completed play earns 1 point. Standings are calculated directly from your table’s protected session history.
    </div>

    <LoadingState v-if="store.loading && !store.entries.length" label="Calculating the standings…" />
    <ErrorState v-else-if="store.error" :message="store.error" @retry="loadLeaderboard" />
    <EmptyState
      v-else-if="!store.entries.length"
      icon="♙"
      title="No standings yet"
      description="Complete the first game session to put players on the board."
    />

    <div v-else class="overflow-hidden rounded-2xl border border-white/10 bg-[#181d27]">
      <div class="hidden grid-cols-[5rem_1fr_7rem_7rem_7rem] border-b border-white/10 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 sm:grid">
        <span>Rank</span><span>Player</span><span class="text-right">Wins</span><span class="text-right">Plays</span><span class="text-right">Points</span>
      </div>
      <ol>
        <li
          v-for="(entry, index) in store.entries"
          :key="entry.userId"
          class="grid gap-4 border-b border-white/10 px-5 py-5 last:border-0 sm:grid-cols-[5rem_1fr_7rem_7rem_7rem] sm:items-center sm:px-6"
          :class="entry.userId === authStore.user?.id ? 'bg-[#8b5cf6]/10' : ''"
        >
          <div class="flex items-center justify-between sm:block">
            <span class="text-xs uppercase tracking-wider text-slate-400 sm:hidden">Rank</span>
            <span class="text-2xl font-black tabular-nums" :class="index < 3 ? 'text-[#57d2a4]' : 'text-slate-400'">#{{ index + 1 }}</span>
          </div>
          <div>
            <p class="font-bold text-white">{{ entry.displayName }} <span v-if="entry.userId === authStore.user?.id" class="ml-2 text-xs font-semibold uppercase tracking-wider text-[#bda7ff]">You</span></p>
            <p class="mt-1 text-xs text-slate-400">{{ entry.totalPlays === 1 ? '1 completed game' : `${entry.totalPlays} completed games` }}</p>
          </div>
          <div class="flex justify-between sm:block sm:text-right"><span class="text-xs uppercase text-slate-400 sm:hidden">Wins</span><strong class="tabular-nums text-white">{{ entry.totalWins }}</strong></div>
          <div class="flex justify-between sm:block sm:text-right"><span class="text-xs uppercase text-slate-400 sm:hidden">Plays</span><strong class="tabular-nums text-white">{{ entry.totalPlays }}</strong></div>
          <div class="flex justify-between sm:block sm:text-right"><span class="text-xs uppercase text-slate-400 sm:hidden">Points</span><strong class="text-xl tabular-nums text-[#ff6b5e]">{{ entry.points }}</strong></div>
        </li>
      </ol>
    </div>
  </div>
</template>
