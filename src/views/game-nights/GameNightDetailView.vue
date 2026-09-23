<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { format } from 'date-fns'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useGroupStore } from '@/stores/groupStore'
import { useGameNightStore } from '@/stores/gameNightStore'
import { useGameStore } from '@/stores/gameStore'
import { useToastStore } from '@/stores/toastStore'
import { useInviteStore } from '@/stores/inviteStore'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EventSessions from '@/components/game-night/EventSessions.vue'
import type { RsvpStatus } from '@/domain/entities/GameNight'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const groupStore = useGroupStore()
const store = useGameNightStore()
const gameStore = useGameStore()
const toastStore = useToastStore()
const inviteStore = useInviteStore()

const editing = ref(false)
const confirmingCancellation = ref(false)
const selectedGameIds = ref<string[]>([])
const inviteLink = ref('')
const form = reactive({
  name: '',
  description: '',
  eventDate: '',
  eventTime: '',
  location: '',
  maxAttendees: null as number | null,
  isPublic: false
})

const event = computed(() => store.currentGameNight)
const isHost = computed(() => Boolean(event.value && authStore.user?.id === event.value.hostId))
const canManage = computed(() => isHost.value && event.value?.status === 'upcoming')
const formattedDate = computed(() => event.value ? format(event.value.eventDate, 'EEEE, MMMM d, yyyy · h:mm a') : '')
const currentRsvp = computed(() => store.rsvps.find((rsvp) => rsvp.userId === authStore.user?.id) ?? null)
const canRsvp = computed(() => Boolean(
  event.value?.status === 'upcoming' && authStore.user && (
    event.value.isPublic ||
    event.value.hostId === authStore.user.id ||
    event.value.invitedUserIds.includes(authStore.user.id)
  )
))
const capacityLabel = computed(() => {
  if (!event.value) return ''
  return event.value.maxAttendees === null
    ? `${event.value.attendeeCount} going · no limit`
    : `${event.value.attendeeCount} of ${event.value.maxAttendees} going`
})
const selectedGames = computed(() => gameStore.games.filter((game) => event.value?.selectedGameIds.includes(game.id)))

async function loadEvent() {
  const groupId = groupStore.activeGroupId
  const eventId = route.params.id
  editing.value = false
  confirmingCancellation.value = false
  if (groupId && typeof eventId === 'string') {
    await store.fetchGameNightById(groupId, eventId)
    if (store.currentGameNight) {
      await Promise.all([groupStore.fetchMembers(groupId), store.fetchRsvps(groupId, eventId), gameStore.fetchGames(groupId)])
      selectedGameIds.value = [...store.currentGameNight.selectedGameIds]
      inviteLink.value = store.currentGameNight.rsvpInviteCode
        ? `${globalThis.location.origin}/invite/${store.currentGameNight.rsvpInviteCode}`
        : ''
    }
  }
}

function startEditing() {
  if (!event.value || !canManage.value) return
  form.name = event.value.name
  form.description = event.value.description ?? ''
  form.eventDate = format(event.value.eventDate, 'yyyy-MM-dd')
  form.eventTime = format(event.value.eventDate, 'HH:mm')
  form.location = event.value.location ?? ''
  form.maxAttendees = event.value.maxAttendees
  form.isPublic = event.value.isPublic
  editing.value = true
}

async function saveChanges() {
  if (!event.value || !groupStore.activeGroupId || !canManage.value) return

  const updated = await store.updateGameNight(groupStore.activeGroupId, event.value.id, {
    name: form.name,
    description: form.description || null,
    eventDate: new Date(`${form.eventDate}T${form.eventTime}`),
    location: form.location || null,
    maxAttendees: form.maxAttendees,
    isPublic: form.isPublic
  })

  if (updated) {
    editing.value = false
    toastStore.show('Game night updated.', 'success')
  } else {
    toastStore.show(store.error ?? 'Unable to update the game night.', 'error')
  }
}

async function cancelEvent() {
  if (!event.value || !groupStore.activeGroupId || !canManage.value) return

  const cancelled = await store.cancelGameNight(groupStore.activeGroupId, event.value.id)
  confirmingCancellation.value = false
  if (cancelled) {
    toastStore.show('Game night cancelled.', 'success')
  } else {
    toastStore.show(store.error ?? 'Unable to cancel the game night.', 'error')
  }
}

async function respond(status: RsvpStatus) {
  if (!event.value || !groupStore.activeGroupId || !authStore.user || !canRsvp.value) return
  const rsvp = await store.respondToGameNight(groupStore.activeGroupId, event.value.id, authStore.user.id, status)
  if (rsvp) toastStore.show(`RSVP updated to ${status.replace('_', ' ')}.`, 'success')
  else toastStore.show(store.rsvpsError ?? 'Unable to update your RSVP.', 'error')
}

async function createInviteLink() {
  if (!event.value || !groupStore.activeGroupId || !canManage.value) return
  const code = await inviteStore.create(groupStore.activeGroupId, event.value)
  if (!code) {
    toastStore.show(inviteStore.error ?? 'Unable to create the RSVP link.', 'error')
    return
  }

  event.value.rsvpInviteCode = code
  inviteLink.value = `${globalThis.location.origin}/invite/${code}`
  toastStore.show('RSVP link ready to share.', 'success')
}

async function copyInviteLink() {
  if (!inviteLink.value) return
  try {
    await globalThis.navigator.clipboard.writeText(inviteLink.value)
    toastStore.show('RSVP link copied.', 'success')
  } catch {
    toastStore.show('Copy failed. Select the link and copy it manually.', 'error')
  }
}

async function saveSelectedGames() {
  if (!event.value || !groupStore.activeGroupId || !canManage.value) return
  const updated = await store.updateGameNight(groupStore.activeGroupId, event.value.id, {
    selectedGameIds: selectedGameIds.value,
    attendeeCount: event.value.attendeeCount
  })
  if (updated) toastStore.show('Event games updated.', 'success')
  else toastStore.show(store.error ?? 'Unable to update event games.', 'error')
}

watch([() => groupStore.activeGroupId, () => route.params.id], () => void loadEvent(), { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <LoadingState v-if="store.loading && !event" label="Loading game night…" />
    <ErrorState v-else-if="store.error && !event" :message="store.error" @retry="loadEvent" />

    <template v-else-if="event">
      <PageHeader :eyebrow="event.status.replace('_', ' ')" :title="event.name" :description="formattedDate">
        <template #actions>
          <AppButton variant="secondary" @click="router.push('/game-nights')">Back</AppButton>
          <AppButton v-if="canManage && !editing" @click="startEditing">Edit event</AppButton>
        </template>
      </PageHeader>

      <ErrorState v-if="store.error" class="mb-6" :message="store.error" :retryable="false" />

      <form v-if="editing" class="space-y-6 rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8" @submit.prevent="saveChanges">
        <AppInput id="edit-event-name" v-model="form.name" label="Event name" required />
        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput id="edit-event-date" v-model="form.eventDate" type="date" label="Date" required />
          <AppInput id="edit-event-time" v-model="form.eventTime" type="time" label="Time" required />
        </div>
        <div>
          <label for="edit-event-description" class="app-label">Description</label>
          <textarea id="edit-event-description" v-model="form.description" rows="4" class="app-field"></textarea>
        </div>
        <AppInput id="edit-event-location" v-model="form.location" label="Location" />
        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput id="edit-event-capacity" v-model.number="form.maxAttendees" type="number" label="Maximum attendees" placeholder="No limit" />
          <label class="flex items-center gap-3 self-end rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300">
            <input v-model="form.isPublic" type="checkbox" class="h-5 w-5 rounded border-white/20 bg-[#10131a] text-[#8b5cf6]">
            Public event
          </label>
        </div>
        <div class="flex justify-end gap-3 border-t border-white/10 pt-5">
          <AppButton type="button" variant="secondary" @click="editing = false">Discard</AppButton>
          <AppButton type="submit" :loading="store.loading">Save changes</AppButton>
        </div>
      </form>

      <div v-else class="space-y-6">
        <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-2xl border border-white/10 bg-[#181d27] p-5"><p class="text-xs uppercase tracking-wider text-slate-500">Date</p><p class="mt-2 font-semibold text-white">{{ format(event.eventDate, 'MMM d, yyyy') }}</p></div>
          <div class="rounded-2xl border border-white/10 bg-[#181d27] p-5"><p class="text-xs uppercase tracking-wider text-slate-500">Time</p><p class="mt-2 font-semibold text-white">{{ format(event.eventDate, 'h:mm a') }}</p></div>
          <div class="rounded-2xl border border-white/10 bg-[#181d27] p-5"><p class="text-xs uppercase tracking-wider text-slate-500">Location</p><p class="mt-2 font-semibold text-white">{{ event.location || 'To be decided' }}</p></div>
          <div class="rounded-2xl border border-white/10 bg-[#181d27] p-5"><p class="text-xs uppercase tracking-wider text-slate-500">Capacity</p><p class="mt-2 font-semibold text-white">{{ event.maxAttendees || 'No limit' }}</p></div>
        </section>

        <section class="rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8">
          <h2 class="text-lg font-bold text-white">About this game night</h2>
          <p class="mt-3 leading-7 text-slate-400">{{ event.description || 'No description has been added yet.' }}</p>
          <div class="mt-6 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wider">
            <span class="rounded-full bg-[#57d2a4]/10 px-3 py-1.5 text-[#57d2a4]">{{ event.isPublic ? 'Public' : 'Private' }}</span>
            <span class="rounded-full bg-white/5 px-3 py-1.5 text-slate-300">{{ isHost ? 'You are the host' : 'Member view' }}</span>
          </div>
        </section>

        <section class="rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8">
          <h2 class="text-lg font-bold text-white">Games for this event</h2>
          <p class="mt-2 text-sm text-slate-400">Choose from the active table’s available library.</p>

          <div v-if="canManage" class="mt-5">
            <div v-if="gameStore.availableGames.length" class="grid gap-3 sm:grid-cols-2">
              <label v-for="game in gameStore.availableGames" :key="game.id" class="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-200">
                <input v-model="selectedGameIds" type="checkbox" :value="game.id" class="h-5 w-5 rounded border-white/20 bg-[#10131a] text-[#8b5cf6]">
                <span><strong class="font-semibold text-white">{{ game.name }}</strong><span class="ml-2 text-slate-500">{{ game.minPlayers }}–{{ game.maxPlayers }} players</span></span>
              </label>
            </div>
            <p v-else class="rounded-xl bg-white/5 p-4 text-sm text-slate-400">Your library has no available games yet.</p>
            <div class="mt-5 flex flex-wrap gap-3">
              <AppButton :loading="store.loading" @click="saveSelectedGames">Save game choices</AppButton>
              <AppButton variant="secondary" @click="router.push('/games/new')">Add a game</AppButton>
            </div>
          </div>

          <ul v-else-if="selectedGames.length" class="mt-5 grid gap-3 sm:grid-cols-2">
            <li v-for="game in selectedGames" :key="game.id" class="rounded-xl border border-white/10 bg-white/5 px-4 py-3"><p class="font-semibold text-white">{{ game.name }}</p><p class="mt-1 text-xs text-slate-500">{{ game.minPlayers }}–{{ game.maxPlayers }} players</p></li>
          </ul>
          <p v-else class="mt-5 text-sm text-slate-500">No games have been selected yet.</p>
        </section>

        <EventSessions
          :group-id="groupStore.activeGroupId!"
          :event="event"
          :games="gameStore.games"
          :members="groupStore.members"
          :is-host="isHost"
        />

        <section class="rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8">
          <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div><h2 class="text-lg font-bold text-white">Attendance</h2><p class="mt-1 text-sm text-slate-400">{{ capacityLabel }}</p></div>
            <span v-if="currentRsvp" class="rounded-full bg-[#57d2a4]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#57d2a4]">Your RSVP: {{ currentRsvp.status.replace('_', ' ') }}</span>
          </div>

          <ErrorState v-if="store.rsvpsError" class="mt-5" :message="store.rsvpsError" :retryable="false" />
          <div v-if="canRsvp" class="mt-6 flex flex-wrap gap-3" aria-label="RSVP options">
            <AppButton :loading="store.rsvpsLoading" :variant="currentRsvp?.status === 'going' ? 'primary' : 'secondary'" @click="respond('going')">Going</AppButton>
            <AppButton :disabled="store.rsvpsLoading" :variant="currentRsvp?.status === 'maybe' ? 'primary' : 'secondary'" @click="respond('maybe')">Maybe</AppButton>
            <AppButton :disabled="store.rsvpsLoading" :variant="currentRsvp?.status === 'not_going' ? 'primary' : 'secondary'" @click="respond('not_going')">Can’t go</AppButton>
          </div>
          <p v-else-if="event.status === 'upcoming'" class="mt-5 rounded-xl bg-white/5 p-4 text-sm text-slate-400">This is an invitation-only event. The host can add you to the guest list.</p>

          <div v-if="store.rsvps.length" class="mt-7 border-t border-white/10 pt-5">
            <h3 class="text-sm font-semibold text-white">Responses</h3>
            <ul class="mt-3 space-y-2">
              <li v-for="rsvp in store.rsvps" :key="rsvp.userId" class="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm">
                <span class="text-slate-200">{{ groupStore.members.find((member) => member.userId === rsvp.userId)?.displayName ?? 'Group member' }}</span>
                <span class="capitalize text-slate-400">{{ rsvp.status.replace('_', ' ') }}</span>
              </li>
            </ul>
          </div>
        </section>

        <section v-if="canManage && !event.isPublic" class="rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8">
          <h2 class="text-lg font-bold text-white">Share an RSVP link</h2>
          <p class="mt-2 text-sm text-slate-400">Anyone with this private link can join {{ groupStore.activeGroup?.name }} and RSVP after signing in.</p>
          <div v-if="inviteLink" class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
            <AppInput id="rsvp-link" :model-value="inviteLink" label="RSVP link" readonly class="min-w-0 flex-1" />
            <AppButton class="sm:shrink-0" :loading="inviteStore.loading" @click="copyInviteLink">Copy link</AppButton>
          </div>
          <AppButton v-else class="mt-5" :loading="inviteStore.loading" @click="createInviteLink">Create RSVP link</AppButton>
          <p v-if="inviteStore.error" class="mt-3 text-sm text-red-300" role="alert">{{ inviteStore.error }}</p>
        </section>

        <section v-if="canManage" class="rounded-2xl border border-red-500/15 bg-red-500/5 p-6">
          <div v-if="!confirmingCancellation" class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div><h2 class="font-bold text-white">Cancel this event</h2><p class="mt-1 text-sm text-slate-400">The event remains visible as cancelled for your group’s history.</p></div>
            <AppButton variant="danger" @click="confirmingCancellation = true">Cancel event</AppButton>
          </div>
          <div v-else>
            <h2 class="font-bold text-red-100">Cancel {{ event.name }}?</h2>
            <p class="mt-2 text-sm text-red-200/70">This will close the event and prevent further editing.</p>
            <div class="mt-5 flex gap-3">
              <AppButton variant="danger" :loading="store.loading" @click="cancelEvent">Yes, cancel event</AppButton>
              <AppButton variant="secondary" @click="confirmingCancellation = false">Keep event</AppButton>
            </div>
          </div>
        </section>
      </div>
    </template>

    <EmptyState v-else icon="?" title="Game night not found" description="This event may have been removed or may belong to another table.">
      <template #actions><AppButton variant="secondary" @click="router.push('/game-nights')">Back to game nights</AppButton></template>
    </EmptyState>
  </div>
</template>
