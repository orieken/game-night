<script setup lang="ts">
import { computed, watch } from 'vue'
import { format } from 'date-fns'
import AppButton from '@/components/common/AppButton.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useGameNightStore } from '@/stores/gameNightStore'
import { useGameStore } from '@/stores/gameStore'
import { useGroupStore } from '@/stores/groupStore'
import { useLeaderboardStore } from '@/stores/leaderboardStore'

const router = useRouter()
const authStore = useAuthStore()
const groupStore = useGroupStore()
const eventStore = useGameNightStore()
const gameStore = useGameStore()
const leaderboardStore = useLeaderboardStore()

const nextEvent = computed(() => [...eventStore.gameNights]
  .filter((event) => event.status === 'upcoming')
  .sort((left, right) => left.eventDate.getTime() - right.eventDate.getTime())[0] ?? null)
const currentStanding = computed(() => leaderboardStore.entries.find((entry) => entry.userId === authStore.user?.id) ?? null)
const upcomingCount = computed(() => eventStore.gameNights.filter((event) => event.status === 'upcoming').length)

function loadDashboard() {
  const groupId = groupStore.activeGroupId
  if (groupId) void Promise.all([
    eventStore.fetchGameNights(groupId),
    gameStore.fetchGames(groupId),
    leaderboardStore.fetchLeaderboard(groupId)
  ])
}

watch(() => groupStore.activeGroupId, loadDashboard, { immediate: true })
</script>

<template>
  <div>
    <PageHeader eyebrow="Your table awaits" title="Make tonight count." description="Plan the next session, choose the games, and keep the good stories in one place.">
      <template #actions>
        <AppButton class="!rounded-xl !bg-[#ff6b5e] !px-5 !py-3 !text-[#10131a] hover:!bg-[#ff877c]" @click="router.push('/game-nights/create')">Plan a game night</AppButton>
      </template>
    </PageHeader>

    <section class="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <article class="relative overflow-hidden rounded-3xl border border-[#8b5cf6]/30 bg-gradient-to-br from-[#292047] via-[#1d2433] to-[#151a24] p-7 sm:p-9">
        <div class="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#8b5cf6]/30 blur-3xl"></div>
        <p class="relative text-sm font-semibold text-[#c4b5fd]">UP NEXT</p>
        <template v-if="nextEvent">
          <h2 class="display-title relative mt-3 text-3xl font-bold text-white">{{ nextEvent.name }}</h2>
          <p class="relative mt-3 text-[#c4b5fd]">{{ format(nextEvent.eventDate, 'EEEE, MMMM d · h:mm a') }}</p>
          <p class="relative mt-2 max-w-md text-slate-300">{{ nextEvent.location || 'Location to be decided' }} · {{ nextEvent.attendeeCount }} going</p>
          <AppButton class="relative mt-6" @click="router.push(`/game-nights/${nextEvent.id}`)">View event</AppButton>
        </template>
        <template v-else>
          <h2 class="display-title relative mt-3 text-3xl font-bold text-white">Your next game night starts here.</h2>
          <p class="relative mt-3 max-w-md text-slate-300">Create an event to invite your table, add the contenders, and get the night on the calendar.</p>
          <AppButton class="relative mt-6" @click="router.push('/game-nights/create')">Create an event</AppButton>
        </template>
      </article>

      <article class="rounded-3xl border border-white/10 bg-[#181d27] p-7">
        <p class="text-sm font-semibold text-[#57d2a4]">YOUR STANDING</p>
        <h2 class="display-title mt-3 text-2xl font-bold text-white">{{ currentStanding ? `${currentStanding.points} points` : 'First play awaits' }}</h2>
        <p class="mt-3 text-sm leading-6 text-slate-400">{{ currentStanding ? `${currentStanding.totalWins} wins across ${currentStanding.totalPlays} completed plays.` : 'Complete a session to join your table’s leaderboard.' }}</p>
        <button type="button" class="mt-6 min-h-11 text-sm font-semibold text-[#f7f1e6] underline decoration-[#ff6b5e] decoration-2 underline-offset-4" @click="router.push('/leaderboard')">View standings</button>
      </article>
    </section>

    <section class="mt-10 grid gap-5 md:grid-cols-3">
      <div class="rounded-2xl border border-white/10 bg-[#181d27] p-6">
        <p class="text-sm text-slate-400">Planned nights</p>
        <p class="mt-3 text-3xl font-bold text-white">{{ upcomingCount }}</p>
      </div>
      <div class="rounded-2xl border border-white/10 bg-[#181d27] p-6">
        <p class="text-sm text-slate-400">Games in library</p>
        <p class="mt-3 text-3xl font-bold text-white">{{ gameStore.games.length }}</p>
      </div>
      <div class="rounded-2xl border border-white/10 bg-[#181d27] p-6">
        <p class="text-sm text-slate-400">Recorded plays</p>
        <p class="mt-3 text-3xl font-bold text-white">{{ currentStanding?.totalPlays ?? 0 }}</p>
      </div>
    </section>
  </div>
</template>
