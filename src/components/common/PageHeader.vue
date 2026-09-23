<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  eyebrow?: string
}>()
</script>

<template>
  <header class="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
    <div>
      <p v-if="eyebrow" class="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#57d2a4]">{{ eyebrow }}</p>
      <h1 class="display-title text-3xl font-bold tracking-tight text-[#f7f1e6] sm:text-4xl">{{ title }}</h1>
      <p v-if="description" class="mt-2 max-w-2xl text-slate-400">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-3 sm:shrink-0">
      <slot name="actions" />
    </div>
  </header>
</template>
