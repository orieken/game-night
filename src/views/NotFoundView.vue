<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
</script>

<template>
  <section class="mx-auto flex min-h-[65vh] max-w-2xl flex-col items-center justify-center text-center">
    <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[#57d2a4]">404 · Lost piece</p>
    <h1 class="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">This space isn’t on the board.</h1>
    <p class="mt-4 max-w-lg leading-7 text-slate-400">The page may have moved, or the link may point to a feature that isn’t ready yet.</p>
    <div class="mt-8 flex flex-wrap justify-center gap-3">
      <AppButton class="!bg-[#ff6b5e] !text-[#10131a] hover:!bg-[#ff877c]" @click="router.push('/')">Back to dashboard</AppButton>
      <AppButton variant="secondary" @click="router.back()">Go back</AppButton>
    </div>
  </section>
</template>
