<script setup lang="ts">
withDefaults(defineProps<{
  message: string
  retryLabel?: string
  retryable?: boolean
}>(), {
  retryLabel: 'Try again',
  retryable: true
})

defineEmits<{ retry: [] }>()
</script>

<template>
  <section class="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-8 text-center" role="alert">
    <div class="text-2xl" aria-hidden="true">!</div>
    <h2 class="mt-3 text-lg font-bold text-red-100">Something went wrong</h2>
    <p class="mx-auto mt-2 max-w-xl text-sm leading-6 text-red-200/80">{{ message }}</p>
    <button v-if="retryable" type="button" class="mt-5 rounded-xl border border-red-300/20 bg-red-100/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-100/15" @click="$emit('retry')">
      {{ retryLabel }}
    </button>
  </section>
</template>
