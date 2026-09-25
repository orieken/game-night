<script setup lang="ts">
import type { Campaign } from '@/domain/entities/Campaign'

defineProps<{ campaign: Campaign }>()

const statusStyles = {
  active: 'border-[#57d2a4]/30 bg-[#57d2a4]/10 text-[#57d2a4]',
  on_hold: 'border-amber-300/30 bg-amber-300/10 text-amber-200',
  completed: 'border-[#8b5cf6]/30 bg-[#8b5cf6]/10 text-[#c4b5fd]',
  archived: 'border-white/10 bg-white/5 text-slate-400'
}
</script>

<template>
  <RouterLink :to="`/campaigns/${campaign.id}`" class="app-surface group block rounded-2xl p-6 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:border-[#8b5cf6]/50 hover:bg-[#1d2330] focus:outline-none focus:ring-2 focus:ring-[#57d2a4]">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-[#c4b5fd]">{{ campaign.kind === 'campaign_board_game' ? 'Campaign board game' : 'Tabletop RPG' }} · {{ campaign.system }}</p>
        <h2 class="mt-2 text-xl font-bold text-white">{{ campaign.name }}</h2>
        <p v-if="campaign.variant" class="mt-1 text-sm text-slate-400">{{ campaign.variant }}</p>
      </div>
      <span class="rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider" :class="statusStyles[campaign.status]">
        {{ campaign.status.replace('_', ' ') }}
      </span>
    </div>
    <p v-if="campaign.description" class="mt-4 line-clamp-3 text-sm leading-6 text-slate-300">{{ campaign.description }}</p>
    <div class="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400">
      <span>{{ campaign.memberIds.length }} {{ campaign.memberIds.length === 1 ? 'player' : 'players' }} · {{ campaign.dmIds.length }} {{ campaign.kind === 'campaign_board_game' ? (campaign.dmIds.length === 1 ? 'manager' : 'managers') : (campaign.dmIds.length === 1 ? 'DM' : 'DMs') }}</span>
      <span class="text-[#57d2a4] transition group-hover:translate-x-1" aria-hidden="true">→</span>
    </div>
  </RouterLink>
</template>
