<script setup lang="ts">
import { computed, watch } from 'vue'
import { format } from 'date-fns'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { useAuthStore } from '@/stores/authStore'
import { useGroupStore } from '@/stores/groupStore'
import { useLeaderboardStore } from '@/stores/leaderboardStore'

const authStore = useAuthStore()
const groupStore = useGroupStore()
const leaderboardStore = useLeaderboardStore()

const member = computed(() => groupStore.members.find((item) => item.userId === authStore.user?.id) ?? null)
const leaderboardIndex = computed(() => leaderboardStore.entries.findIndex((item) => item.userId === authStore.user?.id))
const stats = computed(() => {
  const entry = leaderboardIndex.value >= 0 ? leaderboardStore.entries[leaderboardIndex.value] : null
  const totalPlays = entry?.totalPlays ?? 0
  const totalWins = entry?.totalWins ?? 0
  return {
    totalPlays,
    totalWins,
    points: entry?.points ?? 0,
    rank: entry ? leaderboardIndex.value + 1 : null,
    winRate: totalPlays ? Math.round((totalWins / totalPlays) * 100) : 0
  }
})
const displayName = computed(() => authStore.user?.displayName ?? authStore.user?.username ?? 'Player')
const initials = computed(() => displayName.value
  .split(/\s+/)
  .map((part) => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase())
const loading = computed(() => groupStore.membersLoading || leaderboardStore.loading)
const error = computed(() => groupStore.membersError ?? leaderboardStore.error)

async function loadProfile() {
  if (!groupStore.activeGroupId) return
  await Promise.all([
    groupStore.fetchMembers(groupStore.activeGroupId),
    leaderboardStore.fetchLeaderboard(groupStore.activeGroupId)
  ])
}

watch(() => groupStore.activeGroupId, () => void loadProfile(), { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-5xl">
    <PageHeader
      eyebrow="Your player profile"
      title="Profile"
      :description="`Your stats and identity for ${groupStore.activeGroup?.name ?? 'the active table'}.`"
    />

    <LoadingState v-if="loading && !member" label="Calculating your player profile…" />
    <ErrorState v-else-if="error" :message="error" @retry="loadProfile" />

    <div v-else class="space-y-6">
      <section class="overflow-hidden rounded-3xl border border-white/10 bg-[#181d27]">
        <div class="h-24 bg-gradient-to-r from-[#33255e] via-[#253453] to-[#174638]"></div>
        <div class="px-6 pb-7 sm:px-8">
          <div class="-mt-10 flex flex-col gap-5 sm:flex-row sm:items-end">
            <img v-if="authStore.user?.avatarUrl" :src="authStore.user.avatarUrl" :alt="`${displayName} avatar`" class="h-20 w-20 rounded-2xl border-4 border-[#181d27] object-cover">
            <div v-else class="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border-4 border-[#181d27] bg-[#57d2a4] text-xl font-black text-[#10131a]" aria-hidden="true">{{ initials }}</div>
            <div class="min-w-0 flex-1 pb-1">
              <div class="flex flex-wrap items-center gap-3">
                <h1 class="display-title truncate text-2xl font-bold text-white">{{ displayName }}</h1>
                <span v-if="member" class="rounded-full bg-[#8b5cf6]/15 px-3 py-1 text-xs font-semibold capitalize text-[#bda7ff]">{{ member.role }}</span>
              </div>
              <p class="mt-1 text-sm text-slate-400">{{ authStore.user?.email }}</p>
            </div>
          </div>
          <p v-if="authStore.user?.bio" class="mt-5 max-w-2xl text-sm leading-6 text-slate-300">{{ authStore.user.bio }}</p>
          <div class="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
            <span>@{{ authStore.user?.username }}</span>
            <span v-if="member">Joined this table {{ format(member.joinedAt, 'MMMM d, yyyy') }}</span>
            <span v-if="authStore.user">Account created {{ format(authStore.user.createdAt, 'MMMM yyyy') }}</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="player-stats-heading">
        <div class="mb-4 flex items-end justify-between gap-4">
          <div><p class="text-xs font-semibold uppercase tracking-[0.16em] text-[#57d2a4]">Active table</p><h2 id="player-stats-heading" class="mt-1 text-xl font-bold text-white">Player stats</h2></div>
          <RouterLink to="/leaderboard" class="text-sm font-semibold text-[#bda7ff] hover:text-white">View leaderboard</RouterLink>
        </div>
        <dl class="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div class="rounded-2xl border border-white/10 bg-[#181d27] p-5"><dt class="text-xs uppercase tracking-wider text-slate-400">Points</dt><dd class="mt-2 text-3xl font-black tabular-nums text-[#ff6b5e]">{{ stats.points }}</dd></div>
          <div class="rounded-2xl border border-white/10 bg-[#181d27] p-5"><dt class="text-xs uppercase tracking-wider text-slate-400">Wins</dt><dd class="mt-2 text-3xl font-black tabular-nums text-white">{{ stats.totalWins }}</dd></div>
          <div class="rounded-2xl border border-white/10 bg-[#181d27] p-5"><dt class="text-xs uppercase tracking-wider text-slate-400">Games</dt><dd class="mt-2 text-3xl font-black tabular-nums text-white">{{ stats.totalPlays }}</dd></div>
          <div class="rounded-2xl border border-white/10 bg-[#181d27] p-5"><dt class="text-xs uppercase tracking-wider text-slate-400">Win rate</dt><dd class="mt-2 text-3xl font-black tabular-nums text-[#57d2a4]">{{ stats.winRate }}%</dd></div>
          <div class="col-span-2 rounded-2xl border border-white/10 bg-[#181d27] p-5 lg:col-span-1"><dt class="text-xs uppercase tracking-wider text-slate-400">Rank</dt><dd class="mt-2 text-3xl font-black tabular-nums text-[#bda7ff]">{{ stats.rank ? `#${stats.rank}` : '—' }}</dd></div>
        </dl>
      </section>

      <div v-if="stats.totalPlays === 0" class="rounded-2xl border border-[#57d2a4]/15 bg-[#57d2a4]/5 px-5 py-4 text-sm leading-6 text-slate-300">
        No completed games yet. Your wins, points, win rate, and table rank will appear after the first result is recorded.
      </div>
    </div>
  </div>
</template>
