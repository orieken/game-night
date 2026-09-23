<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useGroupStore } from '@/stores/groupStore'
import GroupSelector from '@/components/group/GroupSelector.vue'

const authStore = useAuthStore()
const groupStore = useGroupStore()
const router = useRouter()

const initials = computed(() => {
  const name = authStore.user?.displayName ?? authStore.user?.username ?? 'Player'
  return name.slice(0, 2).toUpperCase()
})

const navigation = [
  { label: 'Overview', to: '/', icon: '⌂' },
  { label: 'Game nights', to: '/game-nights', icon: '◈' },
  { label: 'Library', to: '/games', icon: '◌' },
  { label: 'Users', to: '/users', icon: '♙' },
  { label: 'Leaderboard', to: '/leaderboard', icon: '♜' }
]

async function handleLogout() {
  await authStore.logout()
  await router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-[#10131a] text-[#f7f1e6]">
    <aside class="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/10 bg-[#151a24] px-4 py-6 lg:flex">
      <router-link to="/" class="mb-10 flex items-center gap-3 px-2 text-lg font-bold tracking-tight text-[#f7f1e6]">
        <span class="grid h-9 w-9 place-items-center rounded-xl bg-[#ff6b5e] text-xl text-[#10131a]">✦</span>
        Game Night
      </router-link>

      <div class="mb-7 px-2">
        <GroupSelector />
      </div>

      <nav class="space-y-1" aria-label="Main navigation">
        <router-link
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
          active-class="!bg-[#8b5cf6]/20 !text-[#f7f1e6]"
        >
          <span class="text-lg" aria-hidden="true">{{ item.icon }}</span>
          {{ item.label }}
        </router-link>
      </nav>

      <div class="mt-auto border-t border-white/10 pt-4">
        <router-link to="/profile" class="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-white/5" aria-label="View your profile">
          <div class="grid h-9 w-9 place-items-center rounded-full bg-[#57d2a4] text-xs font-bold text-[#10131a]">{{ initials }}</div>
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-white">{{ authStore.user?.displayName ?? authStore.user?.username }}</p>
            <p class="text-xs text-slate-500">View your profile</p>
          </div>
        </router-link>
        <button class="min-h-11 w-full rounded-xl px-3 py-2 text-left text-sm text-slate-400 transition hover:bg-white/5 hover:text-white" type="button" @click="handleLogout">Sign out</button>
      </div>
    </aside>

    <main class="min-h-screen pb-24 lg:ml-64 lg:pb-8">
      <div class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 lg:px-10 lg:py-10">
        <div class="mb-6 lg:hidden">
          <GroupSelector />
        </div>

        <section v-if="authStore.user && !groupStore.activeGroup" class="mx-auto mt-12 max-w-xl rounded-3xl border border-[#ff6b5e]/25 bg-[#181d27] p-8 text-center">
          <div class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#ff6b5e]/15 text-2xl" aria-hidden="true">✦</div>
          <h1 class="mt-5 text-2xl font-bold text-white">Let’s set up your table</h1>
          <p class="mt-3 text-sm leading-6 text-slate-400">We couldn’t finish loading your first game group. Retry setup to create or reconnect your personal table.</p>
          <p v-if="authStore.error" class="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300" role="alert">{{ authStore.error }}</p>
          <button type="button" class="mt-6 rounded-xl bg-[#ff6b5e] px-5 py-3 text-sm font-bold text-[#10131a] transition hover:bg-[#ff877c] disabled:opacity-60" :disabled="authStore.loading" @click="authStore.retryGroupSetup()">
            {{ authStore.loading ? 'Setting up…' : 'Retry setup' }}
          </button>
        </section>
        <slot v-else />
      </div>
    </main>

    <nav class="fixed inset-x-0 bottom-0 z-10 flex border-t border-white/10 bg-[#151a24]/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden" aria-label="Mobile navigation">
      <router-link
        v-for="item in navigation"
        :key="item.to"
        :to="item.to"
        class="flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium text-slate-400"
        active-class="!text-[#57d2a4]"
      >
        <span class="text-base" aria-hidden="true">{{ item.icon }}</span>
        {{ item.label }}
      </router-link>
    </nav>
  </div>
</template>
