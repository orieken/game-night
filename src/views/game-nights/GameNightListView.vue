<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGameNightStore } from '@/stores/gameNightStore'
import { useGroupStore } from '@/stores/groupStore'
import type { GameNight, GameNightType } from '@/domain/entities/GameNight'
import { gameNightTypeOptions } from '@/domain/gameNightTypes'
import GameNightCard from '@/components/game-night/GameNightCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const store = useGameNightStore()
const groupStore = useGroupStore()
const timingFilter = ref<'upcoming' | 'history' | 'all'>('upcoming')
const typeFilter = ref<'all' | GameNightType>('all')

function isHistorical(event: GameNight) {
  return ['completed', 'cancelled'].includes(event.status) || event.eventDate.getTime() < Date.now()
}

const filteredGameNights = computed(() => {
  return store.gameNights
    .filter((event) => {
      const matchesTiming = timingFilter.value === 'all' ||
        (timingFilter.value === 'history' ? isHistorical(event) : !isHistorical(event))
      const matchesType = typeFilter.value === 'all' || event.eventType === typeFilter.value
      return matchesTiming && matchesType
    })
    .sort((left, right) => timingFilter.value === 'history'
      ? right.eventDate.getTime() - left.eventDate.getTime()
      : left.eventDate.getTime() - right.eventDate.getTime())
})

const resultLabel = computed(() => {
  const count = filteredGameNights.value.length
  const period = timingFilter.value === 'all' ? 'event' : timingFilter.value === 'history' ? 'past event' : 'upcoming event'
  return `${count} ${period}${count === 1 ? '' : 's'}`
})

function loadGameNights() {
  if (groupStore.activeGroupId) void store.fetchGameNights(groupStore.activeGroupId)
}

watch(() => groupStore.activeGroupId, loadGameNights, { immediate: true })
</script>

<template>
  <div>
    <PageHeader title="Game nights" :description="`Upcoming events and sessions for ${groupStore.activeGroup?.name ?? 'your table'}.`">
      <template #actions>
        <AppButton @click="$router.push('/game-nights/create')">Plan event</AppButton>
      </template>
    </PageHeader>

    <LoadingState v-if="store.loading" label="Loading game nights…" />

    <ErrorState v-else-if="store.error" :message="store.error" @retry="loadGameNights" />

    <EmptyState v-else-if="store.gameNights.length === 0" icon="◈" title="No game nights scheduled" description="Start planning the first gathering for this table.">
      <template #actions>
        <AppButton @click="$router.push('/game-nights/create')">Create event</AppButton>
      </template>
    </EmptyState>

    <div v-else>
      <section class="mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#181d27] p-4 sm:flex-row sm:items-end sm:justify-between" aria-label="Event filters">
        <div>
          <p class="app-label">When</p>
          <div class="flex flex-wrap gap-2" role="group" aria-label="Event timing">
            <button
              v-for="option in ['upcoming', 'history', 'all'] as const"
              :key="option"
              type="button"
              class="rounded-full border px-4 py-2 text-sm font-semibold capitalize transition focus:outline-none focus:ring-2 focus:ring-[#57d2a4]"
              :class="timingFilter === option ? 'border-[#57d2a4]/60 bg-[#57d2a4]/10 text-[#57d2a4]' : 'border-white/10 text-slate-300 hover:border-white/20'"
              :aria-pressed="timingFilter === option"
              @click="timingFilter = option"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <div class="sm:w-56">
          <label class="app-label" for="event-type-filter">Event type</label>
          <select id="event-type-filter" v-model="typeFilter" class="app-field">
            <option value="all">All event types</option>
            <option v-for="option in gameNightTypeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </div>
      </section>

      <div class="mb-4 flex items-center justify-between gap-4">
        <p class="text-sm text-slate-400" aria-live="polite">{{ resultLabel }}</p>
        <button
          v-if="timingFilter !== 'upcoming' || typeFilter !== 'all'"
          type="button"
          class="text-sm font-semibold text-[#57d2a4] hover:text-[#7be4bc] focus:outline-none focus:ring-2 focus:ring-[#57d2a4]"
          @click="timingFilter = 'upcoming'; typeFilter = 'all'"
        >
          Reset filters
        </button>
      </div>

      <div v-if="filteredGameNights.length" class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <GameNightCard
          v-for="event in filteredGameNights"
          :key="event.id"
          :game-night="event"
        />
      </div>

      <EmptyState
        v-else
        icon="⌕"
        title="No matching events"
        description="Try another event type or time period."
      />
    </div>
  </div>
</template>
