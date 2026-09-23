<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const validationError = ref('')

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const redirectTarget = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
  ? route.query.redirect
  : '/'

const handleRegister = async () => {
  validationError.value = ''

  if (password.value !== confirmPassword.value) {
    validationError.value = 'Passwords do not match'
    return
  }

  const success = await authStore.register(email.value, password.value, username.value)
  if (success) {
    router.push(redirectTarget)
  }
}
</script>

<template>
  <main id="main-content" tabindex="-1" class="min-h-screen bg-[#10131a] p-4 sm:p-6 lg:p-8">
    <div class="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-[#181d27] shadow-2xl shadow-black/30 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.05fr_0.95fr]">
      <section class="relative hidden overflow-hidden bg-gradient-to-br from-[#33255e] via-[#202b46] to-[#151a24] p-10 lg:flex lg:flex-col">
        <div class="absolute -left-20 top-20 h-72 w-72 rounded-full bg-[#ff6b5e]/25 blur-3xl"></div>
        <div class="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-[#57d2a4]/20 blur-3xl"></div>
        <div class="relative flex items-center gap-3 text-lg font-bold text-[#f7f1e6]"><span class="grid h-10 w-10 place-items-center rounded-xl bg-[#ff6b5e] text-xl text-[#10131a]">✦</span>Game Night</div>
        <div class="relative my-auto max-w-lg">
          <p class="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#57d2a4]">Pull up a chair</p>
          <p class="display-title text-5xl font-bold leading-[1.05] tracking-tight text-white">Build a table worth returning to.</p>
          <p class="mt-6 text-lg leading-8 text-slate-300">Plan the night, share the shelf, and remember who really won.</p>
        </div>
      </section>

      <section class="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-16">
        <div class="w-full max-w-md">
          <router-link to="/" class="mb-10 flex items-center gap-3 text-lg font-bold text-[#f7f1e6] lg:hidden"><span class="grid h-9 w-9 place-items-center rounded-xl bg-[#ff6b5e] text-xl text-[#10131a]">✦</span>Game Night</router-link>
          <div class="mb-8"><p class="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#57d2a4]">Join the table</p><h1 class="display-title text-3xl font-bold tracking-tight text-white">Create your account.</h1><p class="mt-2 text-slate-400">Start a private table for your game-night crew.</p></div>

          <form class="space-y-5" @submit.prevent="handleRegister">
            <div v-if="authStore.error || validationError" class="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300" role="alert">{{ authStore.error || validationError }}</div>
            <AppInput id="username" v-model="username" label="Display name" placeholder="Oscar" required autocomplete="name" />
            <AppInput id="email" v-model="email" label="Email" type="email" placeholder="you@example.com" required autocomplete="email" />
            <AppInput id="password" v-model="password" label="Password" type="password" placeholder="••••••••" required minlength="6" autocomplete="new-password" />
            <AppInput id="confirm-password" v-model="confirmPassword" label="Confirm password" type="password" placeholder="••••••••" required minlength="6" autocomplete="new-password" />
            <AppButton type="submit" class="w-full" :loading="authStore.loading">Create account</AppButton>
          </form>

          <p class="mt-6 text-center text-sm text-slate-400">Already have an account? <router-link :to="{ path: '/login', query: route.query }" class="font-semibold text-[#57d2a4] hover:text-[#85e4c3]">Sign in</router-link></p>
        </div>
      </section>
    </div>
  </main>
</template>
