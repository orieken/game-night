<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), {
  label: 'Loading…'
})
</script>

<template>
  <div class="flex min-h-48 flex-col items-center justify-center gap-4 rounded-2xl border border-white/5 bg-[#181d27]/60 py-12" role="status" aria-live="polite">
    <div class="h-9 w-9 animate-spin rounded-full border-4 border-[#57d2a4]/25 border-t-[#57d2a4]" aria-hidden="true"></div>
    <p class="text-sm text-slate-400">{{ label }}</p>
  </div>
</template>
