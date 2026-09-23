<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description: string
  icon?: string
}>(), {
  icon: '✦'
})
</script>

<template>
  <section class="rounded-3xl border border-dashed border-white/15 bg-[#181d27]/70 px-6 py-12 text-center">
    <div class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#57d2a4]/10 text-2xl text-[#57d2a4]" aria-hidden="true">{{ icon }}</div>
    <h2 class="mt-5 text-xl font-bold text-white">{{ title }}</h2>
    <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">{{ description }}</p>
    <div v-if="$slots.actions" class="mt-6 flex justify-center">
      <slot name="actions" />
    </div>
  </section>
</template>
