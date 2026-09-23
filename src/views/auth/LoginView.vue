<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'

const email = ref('')
const password = ref('')
const authStore = useAuthStore()
const router = useRouter()

async function handleLogin() {
  if (!email.value || !password.value) return
  if (await authStore.login(email.value, password.value)) await router.replace('/')
}

async function handleGoogleLogin() {
  if (await authStore.loginWithGoogle()) await router.replace('/')
}
</script>

<template>
  <div class="min-h-screen bg-[#10131a] p-4 sm:p-6 lg:p-8">
    <div class="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-[#181d27] shadow-2xl shadow-black/30 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.05fr_0.95fr]">
      <section class="relative hidden overflow-hidden bg-gradient-to-br from-[#33255e] via-[#202b46] to-[#151a24] p-10 lg:flex lg:flex-col">
        <div class="absolute -left-20 top-20 h-72 w-72 rounded-full bg-[#ff6b5e]/25 blur-3xl"></div>
        <div class="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-[#57d2a4]/20 blur-3xl"></div>
        <div class="relative flex items-center gap-3 text-lg font-bold text-[#f7f1e6]"><span class="grid h-10 w-10 place-items-center rounded-xl bg-[#ff6b5e] text-xl text-[#10131a]">✦</span>Game Night</div>
        <div class="relative my-auto max-w-lg">
          <p class="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#57d2a4]">Your table, organized</p>
          <h1 class="display-title text-5xl font-bold leading-[1.05] tracking-tight text-white">Every great night starts with a plan.</h1>
          <p class="mt-6 text-lg leading-8 text-slate-300">Bring together the people, games, and moments that make your group yours.</p>
        </div>
        <div class="relative grid grid-cols-3 gap-3">
          <div class="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"><p class="text-2xl font-bold text-white">Plan</p><p class="mt-1 text-xs text-slate-300">your next table</p></div>
          <div class="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"><p class="text-2xl font-bold text-white">Play</p><p class="mt-1 text-xs text-slate-300">what you love</p></div>
          <div class="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"><p class="text-2xl font-bold text-white">Remember</p><p class="mt-1 text-xs text-slate-300">every result</p></div>
        </div>
      </section>

      <section class="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-16">
        <div class="w-full max-w-md">
          <router-link to="/" class="mb-10 flex items-center gap-3 text-lg font-bold text-[#f7f1e6] lg:hidden"><span class="grid h-9 w-9 place-items-center rounded-xl bg-[#ff6b5e] text-xl text-[#10131a]">✦</span>Game Night</router-link>
          <div class="mb-8"><p class="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#57d2a4]">Welcome back</p><h1 class="display-title text-3xl font-bold tracking-tight text-white">Let’s play.</h1><p class="mt-2 text-slate-400">Sign in to pick up where your table left off.</p></div>
          <form class="space-y-5" @submit.prevent="handleLogin">
            <div v-if="authStore.error" class="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300" role="alert">{{ authStore.error }}</div>
            <AppInput id="email" v-model="email" label="Email" type="email" placeholder="you@example.com" required autocomplete="email" />
            <AppInput id="password" v-model="password" label="Password" type="password" placeholder="••••••••" required autocomplete="current-password" />
            <AppButton type="submit" class="w-full" :loading="authStore.loading">Sign in</AppButton>
          </form>
          <div class="relative my-6" aria-hidden="true"><div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-700"></div></div><div class="relative flex justify-center"><span class="bg-[#181d27] px-3 text-xs uppercase tracking-wider text-gray-500">or continue with</span></div></div>
          <button type="button" class="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-600 bg-white px-4 py-3 font-medium text-gray-900 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50" :disabled="authStore.loading" @click="handleGoogleLogin">
            <svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.51h3.15c1.84-1.7 2.9-4.2 2.9-7.28Z"/><path fill="#34A853" d="M12 21.75c2.63 0 4.83-.87 6.44-2.36l-3.15-2.51c-.87.58-1.98.93-3.29.93-2.53 0-4.68-1.71-5.45-4.01H3.3v2.59A9.73 9.73 0 0 0 12 21.75Z"/><path fill="#FBBC05" d="M6.55 13.8A5.85 5.85 0 0 1 6.24 12c0-.62.11-1.22.31-1.8V7.61H3.3A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.06 1.05 4.39l3.25-2.59Z"/><path fill="#EA4335" d="M12 6.19c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.82 3.28 14.62 2.25 12 2.25a9.73 9.73 0 0 0-8.7 5.36l3.25 2.59C7.32 7.9 9.47 6.19 12 6.19Z"/></svg>
            Continue with Google
          </button>
          <p class="mt-6 text-center text-sm text-gray-400">Don't have an account? <router-link to="/register" class="font-medium text-[#57d2a4] hover:text-[#85e4c3]">Create one</router-link></p>
        </div>
      </section>
    </div>
  </div>
</template>
