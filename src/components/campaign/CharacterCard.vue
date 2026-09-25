<script setup lang="ts">
import { computed } from 'vue'
import type { Character } from '@/domain/entities/Character'

const props = defineProps<{
  character: Character
  campaignId: string
  playerName: string
}>()

const initials = computed(() => props.character.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase())
</script>

<template>
  <RouterLink :to="`/campaigns/${campaignId}/characters/${character.id}`" class="group flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-[#8b5cf6]/40 hover:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-[#57d2a4]">
    <img v-if="character.portraitUrl" :src="character.portraitUrl" :alt="character.name" class="h-16 w-16 shrink-0 rounded-xl object-cover">
    <span v-else class="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-[#8b5cf6]/15 font-bold text-[#c4b5fd]" aria-hidden="true">{{ initials }}</span>
    <span class="min-w-0 flex-1">
      <span class="flex items-start justify-between gap-3"><strong class="truncate text-white">{{ character.name }}</strong><span class="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{{ character.status }}</span></span>
      <span class="mt-1 block text-xs text-slate-400">{{ character.ownershipType === 'table' ? `Table hero · Controlled by ${playerName}` : `Played by ${playerName}` }}<template v-if="character.pronouns"> · {{ character.pronouns }}</template></span>
      <span v-if="character.publicNotes" class="mt-2 line-clamp-1 block text-sm text-slate-300">{{ character.publicNotes }}</span>
    </span>
  </RouterLink>
</template>
