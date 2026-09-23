<script setup lang="ts">
import type { Game } from '@/domain/entities/Game'

defineProps<{
  game: Game
}>()
</script>

<template>
  <RouterLink :to="{ name: 'game-detail', params: { id: game.id } }" class="app-surface group block overflow-hidden rounded-2xl transition hover:-translate-y-0.5 hover:border-[#8b5cf6]/50 focus:outline-none focus:ring-2 focus:ring-[#57d2a4]">
    <div class="relative aspect-video bg-[#222938]">
      <img
        v-if="game.imageUrl"
        :src="game.imageUrl"
        :alt="game.name"
        class="w-full h-full object-cover"
      />
      <div v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#292047] to-[#1b2630] text-[#57d2a4]">
        <span class="text-4xl" aria-hidden="true">◇</span>
      </div>

      <div v-if="!game.isAvailable" class="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
        Unavailable
      </div>
    </div>

    <div class="p-5">
      <div class="mb-2 flex items-start justify-between gap-3">
        <h3 class="text-lg font-bold text-white">{{ game.name }}</h3>
        <span class="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300">
          {{ game.minPlayers }}–{{ game.maxPlayers }} players
        </span>
      </div>

      <p v-if="game.description" class="mb-4 line-clamp-2 text-sm leading-6 text-slate-400">
        {{ game.description }}
      </p>

      <div class="flex gap-2 flex-wrap">
        <span v-for="cat in game.category.slice(0, 3)" :key="cat" class="rounded-full border border-[#8b5cf6]/25 bg-[#8b5cf6]/10 px-2.5 py-1 text-xs text-[#c4b5fd]">
          {{ cat }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>
