<script setup lang="ts">
import { onMounted } from 'vue'
import { format } from 'date-fns'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import { useInviteStore } from '@/stores/inviteStore'

const route = useRoute()
const router = useRouter()
const inviteStore = useInviteStore()
const code = typeof route.params.code === 'string' ? route.params.code : ''

async function acceptInvite() {
  const accepted = await inviteStore.accept()
  if (accepted) await router.replace(`/game-nights/${accepted.eventId}`)
}

onMounted(() => void inviteStore.load(code))
</script>

<template>
  <div class="mx-auto max-w-xl py-10">
    <LoadingState v-if="inviteStore.loading && !inviteStore.invite" label="Loading RSVP invitation…" />
    <ErrorState v-else-if="inviteStore.error && !inviteStore.invite" :message="inviteStore.error" :retryable="false" />
    <section v-else-if="inviteStore.invite" class="rounded-3xl border border-white/10 bg-[#181d27] p-7 text-center shadow-2xl shadow-black/20 sm:p-10">
      <div class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#57d2a4]/15 text-3xl" aria-hidden="true">✦</div>
      <p class="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-[#57d2a4]">You’re invited</p>
      <h1 class="display-title mt-2 text-3xl font-bold text-white">{{ inviteStore.invite.eventName }}</h1>
      <p class="mt-4 text-slate-300">{{ format(inviteStore.invite.eventDate, 'EEEE, MMMM d, yyyy · h:mm a') }}</p>
      <p v-if="inviteStore.invite.location" class="mt-1 text-sm text-slate-400">{{ inviteStore.invite.location }}</p>
      <p class="mt-6 text-sm leading-6 text-slate-400">Accepting adds you to the host’s table and guest list so you can choose Going, Maybe, or Can’t go.</p>
      <p v-if="inviteStore.error" class="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300" role="alert">{{ inviteStore.error }}</p>
      <AppButton class="mt-7 w-full" :loading="inviteStore.loading" @click="acceptInvite">Join table and RSVP</AppButton>
    </section>
  </div>
</template>
