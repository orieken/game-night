<script setup lang="ts">
import { format } from 'date-fns'
import type { AdventureLog } from '@/domain/entities/AdventureLog'

defineProps<{ log: AdventureLog; campaignId: string }>()
</script>

<template>
  <RouterLink :to="`/campaigns/${campaignId}/adventure-logs/${log.id}`" class="group block rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#8b5cf6]/40 hover:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-[#57d2a4]">
    <div class="flex items-start justify-between gap-4"><div><p class="text-xs font-semibold uppercase tracking-wider text-[#c4b5fd]">Session {{ log.sessionNumber }}</p><h3 class="mt-2 font-bold text-white">{{ log.title }}</h3></div><span class="shrink-0 text-xs text-slate-400">{{ format(log.sessionDate, 'MMM d, yyyy') }}</span></div>
    <p v-if="log.recap" class="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{{ log.recap }}</p>
    <div class="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400"><span>{{ log.attendeeIds.length }} attending · {{ log.characterIds.length }} characters</span><span class="text-[#57d2a4]" aria-hidden="true">→</span></div>
  </RouterLink>
</template>
