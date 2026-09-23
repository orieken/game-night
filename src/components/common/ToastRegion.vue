<script setup lang="ts">
import { useToastStore } from '@/stores/toastStore'

const toastStore = useToastStore()
</script>

<template>
  <div class="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-end gap-3 sm:left-auto sm:w-96" aria-label="Notifications">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toastStore.messages"
        :key="toast.id"
        class="pointer-events-auto flex w-full items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl shadow-black/30 backdrop-blur"
        :class="{
          'border-emerald-400/25 bg-emerald-950/95 text-emerald-100': toast.tone === 'success',
          'border-red-400/25 bg-red-950/95 text-red-100': toast.tone === 'error',
          'border-sky-400/25 bg-slate-900/95 text-sky-100': toast.tone === 'info'
        }"
        :role="toast.tone === 'error' ? 'alert' : 'status'"
      >
        <span class="mt-0.5 font-bold" aria-hidden="true">{{ toast.tone === 'success' ? '✓' : toast.tone === 'error' ? '!' : 'i' }}</span>
        <p class="flex-1 text-sm leading-6">{{ toast.message }}</p>
        <button type="button" class="rounded p-1 text-current/70 transition hover:bg-white/10 hover:text-current" aria-label="Dismiss notification" @click="toastStore.dismiss(toast.id)">×</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active { transition: opacity 180ms ease, transform 180ms ease; }
.toast-enter-from,
.toast-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
