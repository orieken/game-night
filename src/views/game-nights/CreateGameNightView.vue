<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameNightStore } from '@/stores/gameNightStore'
import { useAuthStore } from '@/stores/authStore'
import { useGroupStore } from '@/stores/groupStore'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { useToastStore } from '@/stores/toastStore'

const router = useRouter()
const store = useGameNightStore()
const authStore = useAuthStore()
const groupStore = useGroupStore()
const toastStore = useToastStore()

const form = ref({
  name: '',
  description: '',
  eventDate: '',
  eventTime: '',
  location: '',
  maxAttendees: null as number | null,
  isPublic: false
})

const handleSubmit = async () => {
  if (!authStore.user || !groupStore.activeGroupId) return

  // Combine date and time
  const dateTime = new Date(`${form.value.eventDate}T${form.value.eventTime}`)

  const success = await store.createGameNight(groupStore.activeGroupId, {
    name: form.value.name,
    description: form.value.description || null,
    eventDate: dateTime,
    location: form.value.location || null,
    hostId: authStore.user.id,
    status: 'upcoming',
    maxAttendees: form.value.maxAttendees,
    isPublic: form.value.isPublic,
    invitedUserIds: [],
    selectedGameIds: [],
    attendeeCount: 0
  })

  if (success) {
    toastStore.show('Game night created.', 'success')
    router.push('/game-nights')
  } else {
    toastStore.show(store.error ?? 'Unable to create the game night.', 'error')
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <PageHeader title="Create game night" :description="`Plan a new event for ${groupStore.activeGroup?.name ?? 'your table'}.`" />

    <div class="app-surface rounded-2xl p-6 shadow-xl shadow-black/10 sm:p-8">
      <form class="space-y-6" @submit.prevent="handleSubmit">
        <ErrorState v-if="store.error" :message="store.error" :retryable="false" />
        <AppInput
          id="name"
          v-model="form.name"
          label="Event Name"
          placeholder="e.g. Friday Night Catan"
          required
        />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppInput
            id="date"
            v-model="form.eventDate"
            type="date"
            label="Date"
            required
          />
          <AppInput
            id="time"
            v-model="form.eventTime"
            type="time"
            label="Time"
            required
          />
        </div>

        <div>
          <label class="app-label" for="event-description">Description</label>
          <textarea
            id="event-description"
            v-model="form.description"
            rows="3"
            class="app-field min-h-28"
            placeholder="What are we playing? Any snacks?"
          ></textarea>
        </div>

        <AppInput
          id="location"
          v-model="form.location"
          label="Location"
          placeholder="e.g. Oscar's House"
        />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppInput
            id="attendees"
            v-model.number="form.maxAttendees"
            type="number"
            label="Max Attendees (Optional)"
            placeholder="No limit"
          />

          <div class="flex h-full items-center pt-6">
            <label class="flex min-h-11 cursor-pointer items-center space-x-3 rounded-xl border border-white/10 px-4">
              <input
                v-model="form.isPublic"
                type="checkbox"
                class="h-5 w-5 rounded border-white/20 bg-[#10131a] text-[#8b5cf6] focus:ring-[#57d2a4]/50 focus:ring-offset-0"
              >
              <span class="text-slate-300">Public event</span>
            </label>
          </div>
        </div>

        <div class="mt-6 flex flex-col-reverse justify-end gap-3 border-t border-white/10 pt-5 sm:flex-row">
          <AppButton type="button" variant="secondary" @click="$router.back()">Cancel</AppButton>
          <AppButton type="submit" :loading="store.loading">Create Event</AppButton>
        </div>
      </form>
    </div>
  </div>
</template>
