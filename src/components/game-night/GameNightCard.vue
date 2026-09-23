<script setup lang="ts">
import { computed } from 'vue'
import type { GameNight } from '@/domain/entities/GameNight'
import { format } from 'date-fns'
import { gameNightTypeLabel } from '@/domain/gameNightTypes'

const props = defineProps<{
  gameNight: GameNight
}>()

const formattedDate = computed(() => {
  return format(props.gameNight.eventDate, 'MMM d, yyyy h:mm a')
})

const statusColor = computed(() => {
  switch (props.gameNight.status) {
    case 'upcoming': return 'text-[#57d2a4] border-[#57d2a4]/30 bg-[#57d2a4]/10'
    case 'in_progress': return 'text-[#c4b5fd] border-[#8b5cf6]/30 bg-[#8b5cf6]/10'
    case 'completed': return 'text-slate-400 border-white/10 bg-white/5'
    case 'cancelled': return 'text-red-400 border-red-400/30 bg-red-400/10'
    default: return 'text-gray-400'
  }
})
</script>

<template>
  <RouterLink :to="{ name: 'game-night-detail', params: { id: gameNight.id } }" class="app-surface group block rounded-2xl p-6 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:border-[#8b5cf6]/50 hover:bg-[#1d2330] focus:outline-none focus:ring-2 focus:ring-[#57d2a4]">
    <div class="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 class="text-xl font-bold text-white transition group-hover:text-[#f7f1e6]">{{ gameNight.name }}</h3>
        <div class="mt-1 flex items-center text-sm text-slate-400">
          <span class="mr-2" aria-hidden="true">◷</span> {{ formattedDate }}
        </div>
      </div>
      <div
        class="px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider"
        :class="statusColor"
      >
        {{ gameNight.status.replace('_', ' ') }}
      </div>
    </div>

    <p v-if="gameNight.location" class="mb-4 flex items-center text-sm text-slate-400">
      <span class="mr-2" aria-hidden="true">⌖</span> {{ gameNight.location }}
    </p>

    <p v-if="gameNight.description" class="mb-4 line-clamp-2 text-sm leading-6 text-slate-300 md:line-clamp-3">
      {{ gameNight.description }}
    </p>

    <div class="flex items-center justify-between border-t border-white/10 pt-4">
      <div class="text-xs text-slate-400">
        {{ gameNightTypeLabel(gameNight.eventType) }} · {{ gameNight.isPublic ? 'Public event' : 'Private event' }} · {{ gameNight.attendeeCount }} going
      </div>
      <span class="text-[#57d2a4] transition group-hover:translate-x-1" aria-hidden="true">→</span>
    </div>
  </RouterLink>
</template>
