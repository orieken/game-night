<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameNightStore } from '@/stores/gameNightStore'
import { useAuthStore } from '@/stores/authStore'
import { useGroupStore } from '@/stores/groupStore'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { useToastStore } from '@/stores/toastStore'
import { gameNightTypeOptions } from '@/domain/gameNightTypes'
import type { GameNightType } from '@/domain/entities/GameNight'
import { useCampaignStore } from '@/stores/campaignStore'

const router = useRouter()
const store = useGameNightStore()
const authStore = useAuthStore()
const groupStore = useGroupStore()
const toastStore = useToastStore()
const campaignStore = useCampaignStore()

const form = ref({
  name: '',
  eventType: 'board_game' as GameNightType,
  campaignId: '',
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
    eventType: form.value.eventType,
    campaignId: form.value.eventType === 'board_game' ? null : form.value.campaignId || null,
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

watch(() => groupStore.activeGroupId, (groupId) => {
  if (groupId) void campaignStore.fetchCampaigns(groupId)
}, { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <PageHeader title="Create game night" :description="`Plan a new event for ${groupStore.activeGroup?.name ?? 'your table'}.`" />

    <div class="app-surface rounded-2xl p-6 shadow-xl shadow-black/10 sm:p-8">
      <form class="space-y-6" @submit.prevent="handleSubmit">
        <ErrorState v-if="store.error" :message="store.error" :retryable="false" />
        <fieldset>
          <legend class="app-label">Event type</legend>
          <div class="grid gap-3 sm:grid-cols-3">
            <label
              v-for="option in gameNightTypeOptions"
              :key="option.value"
              class="cursor-pointer rounded-xl border p-4 transition"
              :class="form.eventType === option.value ? 'border-[#57d2a4]/70 bg-[#57d2a4]/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'"
            >
              <input v-model="form.eventType" type="radio" name="event-type" :value="option.value" class="sr-only">
              <span class="block font-semibold text-white">{{ option.label }}</span>
              <span class="mt-1 block text-xs leading-5 text-slate-400">{{ option.description }}</span>
            </label>
          </div>
        </fieldset>
        <div v-if="form.eventType !== 'board_game'">
          <label class="app-label" for="campaign">Campaign (optional)</label>
          <select id="campaign" v-model="form.campaignId" class="app-field">
            <option value="">No linked campaign</option>
            <option v-for="campaign in campaignStore.campaigns.filter((item) => item.status !== 'archived')" :key="campaign.id" :value="campaign.id">{{ campaign.name }} · {{ campaign.system }}</option>
          </select>
          <p class="mt-2 text-xs text-slate-400">Link this session to an existing campaign, or create the campaign first.</p>
        </div>
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
