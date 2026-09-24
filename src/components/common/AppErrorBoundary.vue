<script setup lang="ts">
import { onErrorCaptured, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { reportClientError } from '@/services/errorReporter'

const route = useRoute()
const failed = ref(false)
const referenceId = ref<string | null>(null)

onErrorCaptured((error, instance, info) => {
  failed.value = true
  referenceId.value = reportClientError({
    kind: 'vue',
    error,
    component: instance?.$options.name ?? null,
    info
  })
  return false
})

watch(() => route.fullPath, () => {
  failed.value = false
  referenceId.value = null
})

function reload() {
  globalThis.location.reload()
}
</script>

<template>
  <section v-if="failed" class="mx-auto mt-12 max-w-2xl rounded-3xl border border-red-400/20 bg-[#181d27] p-8 text-center" role="alert">
    <div class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/15 text-2xl font-bold text-red-200" aria-hidden="true">!</div>
    <h1 class="mt-5 text-2xl font-bold text-white">This page hit an unexpected problem</h1>
    <p class="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-300">Your saved data is unaffected. Reload this page to try again, or return to the dashboard and continue elsewhere.</p>
    <p v-if="referenceId" class="mt-3 text-xs text-slate-500">Error reference: {{ referenceId }}</p>
    <div class="mt-6 flex flex-wrap justify-center gap-3">
      <button type="button" class="rounded-xl bg-[#ff6b5e] px-5 py-3 text-sm font-bold text-[#10131a] transition hover:bg-[#ff877c]" @click="reload">Reload page</button>
      <a href="/" class="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5">Return to dashboard</a>
    </div>
  </section>
  <slot v-else />
</template>
