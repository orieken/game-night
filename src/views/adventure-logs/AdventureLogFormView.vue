<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { format } from 'date-fns'
import { useRoute, useRouter } from 'vue-router'
import { useAdventureLogStore } from '@/stores/adventureLogStore'
import { useAuthStore } from '@/stores/authStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useGameNightStore } from '@/stores/gameNightStore'
import { useGroupStore } from '@/stores/groupStore'
import { useToastStore } from '@/stores/toastStore'
import type { AdventureLog } from '@/domain/entities/AdventureLog'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import PageHeader from '@/components/common/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const adventureLogStore = useAdventureLogStore()
const authStore = useAuthStore()
const campaignStore = useCampaignStore()
const characterStore = useCharacterStore()
const gameNightStore = useGameNightStore()
const groupStore = useGroupStore()
const toastStore = useToastStore()
const ready = ref(false)
const validationError = ref<string | null>(null)
const campaignId = computed(() => typeof route.params.campaignId === 'string' ? route.params.campaignId : null)
const logId = computed(() => typeof route.params.logId === 'string' ? route.params.logId : null)
const isEditing = computed(() => Boolean(logId.value))
const campaign = computed(() => campaignStore.currentCampaign)
const memberRole = computed(() => groupStore.members.find((member) => member.userId === authStore.user?.id)?.role)
const canManage = computed(() => memberRole.value === 'owner' || memberRole.value === 'organizer' || Boolean(campaign.value?.dmIds.includes(authStore.user?.id ?? '')))
const linkedEvents = computed(() => gameNightStore.gameNights.filter((event) => event.campaignId === campaignId.value && ['tabletop_rpg', 'mixed'].includes(event.eventType)))
const campaignMembers = computed(() => groupStore.members.filter((member) => campaign.value?.memberIds.includes(member.userId)))

const form = reactive({
  eventId: '',
  sessionNumber: 1,
  title: '',
  sessionDate: '',
  attendeeIds: [] as string[],
  characterIds: [] as string[],
  recap: '',
  progress: '',
  loot: '',
  quests: '',
  memorableMoments: '',
  nextSessionHooks: '',
  privateDmNotes: ''
})

async function initialize() {
  ready.value = false
  validationError.value = null
  const groupId = groupStore.activeGroupId
  if (!groupId || !campaignId.value) return
  await Promise.all([
    campaignStore.fetchCampaignById(groupId, campaignId.value),
    groupStore.fetchMembers(groupId),
    gameNightStore.fetchGameNights(groupId),
    characterStore.fetchCharacters(groupId, campaignId.value),
    adventureLogStore.fetchLogs(groupId, campaignId.value)
  ])
  if (logId.value) {
    await adventureLogStore.fetchLogById(groupId, campaignId.value, logId.value)
    if (adventureLogStore.currentLog) populateForm(adventureLogStore.currentLog)
    if (canManage.value) {
      const note = await adventureLogStore.fetchDmNote(groupId, campaignId.value, logId.value)
      form.privateDmNotes = note?.body ?? ''
    }
  } else resetForm()
  ready.value = true
}

function resetForm() {
  adventureLogStore.currentDmNote = null
  form.eventId = ''
  form.sessionNumber = Math.max(0, ...adventureLogStore.logs.map((log) => log.sessionNumber)) + 1
  form.title = ''
  form.sessionDate = ''
  form.attendeeIds = []
  form.characterIds = []
  form.recap = ''
  form.progress = ''
  form.loot = ''
  form.quests = ''
  form.memorableMoments = ''
  form.nextSessionHooks = ''
  form.privateDmNotes = ''
}

function populateForm(log: AdventureLog) {
  form.eventId = log.eventId
  form.sessionNumber = log.sessionNumber
  form.title = log.title
  form.sessionDate = format(log.sessionDate, "yyyy-MM-dd'T'HH:mm")
  form.attendeeIds = [...log.attendeeIds]
  form.characterIds = [...log.characterIds]
  form.recap = log.recap ?? ''
  form.progress = log.progress ?? ''
  form.loot = log.loot ?? ''
  form.quests = log.quests ?? ''
  form.memorableMoments = log.memorableMoments.join('\n')
  form.nextSessionHooks = log.nextSessionHooks ?? ''
}

function syncEventDate() {
  if (isEditing.value) return
  const event = linkedEvents.value.find((item) => item.id === form.eventId)
  if (event) form.sessionDate = format(event.eventDate, "yyyy-MM-dd'T'HH:mm")
}

async function submit() {
  validationError.value = null
  const groupId = groupStore.activeGroupId
  const userId = authStore.user?.id
  if (!groupId || !campaignId.value || !userId || !canManage.value) return
  if (!form.eventId || !form.title.trim() || !form.sessionDate || form.sessionNumber < 1) {
    validationError.value = 'Linked event, session number, title, and date are required.'
    return
  }
  const data = {
    eventId: form.eventId,
    sessionNumber: Number(form.sessionNumber),
    title: form.title.trim(),
    sessionDate: new Date(form.sessionDate),
    attendeeIds: [...form.attendeeIds],
    characterIds: [...form.characterIds],
    recap: form.recap.trim() || null,
    progress: form.progress.trim() || null,
    loot: form.loot.trim() || null,
    quests: form.quests.trim() || null,
    memorableMoments: form.memorableMoments.split('\n').map((moment) => moment.trim()).filter(Boolean),
    nextSessionHooks: form.nextSessionHooks.trim() || null
  }
  const saved = isEditing.value && logId.value
    ? await adventureLogStore.updateLog(groupId, campaignId.value, logId.value, data)
    : await adventureLogStore.createLog(groupId, campaignId.value, { ...data, createdById: userId })
  if (!saved) {
    toastStore.show(adventureLogStore.error ?? 'Unable to save the adventure entry.', 'error')
    return
  }
  if ((form.privateDmNotes.trim() || adventureLogStore.currentDmNote) && !await adventureLogStore.saveDmNote(groupId, campaignId.value, saved.id, form.privateDmNotes.trim(), userId)) {
    toastStore.show('The adventure entry was saved, but the private DM notes could not be saved.', 'error')
    return
  }
  toastStore.show(isEditing.value ? 'Adventure entry updated.' : 'Adventure entry created.', 'success')
  await router.push(`/campaigns/${campaignId.value}/adventure-logs/${saved.id}`)
}

watch([() => groupStore.activeGroupId, campaignId, logId], () => void initialize(), { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <LoadingState v-if="!ready" label="Loading adventure editor…" />
    <ErrorState v-else-if="campaignStore.error || adventureLogStore.error && isEditing && !adventureLogStore.currentLog" :message="campaignStore.error ?? adventureLogStore.error ?? 'Unable to load the adventure entry.'" @retry="initialize" />
    <ErrorState v-else-if="!canManage || campaign?.status === 'archived'" message="Only campaign DMs and table organizers can edit adventure logs for active campaigns." :retryable="false" />
    <template v-else-if="campaign">
      <PageHeader :eyebrow="campaign.name" :title="isEditing ? 'Edit adventure entry' : 'Record an adventure'" description="Capture what happened, who was there, and what comes next." />
      <form class="space-y-7 rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8" @submit.prevent="submit">
        <div v-if="validationError" class="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200" role="alert">{{ validationError }}</div>
        <section class="space-y-5" aria-labelledby="session-basics-heading">
          <h2 id="session-basics-heading" class="text-lg font-bold text-white">Session details</h2>
          <div><label for="linked-event" class="app-label">Linked game night</label><select id="linked-event" v-model="form.eventId" class="app-field" required :disabled="isEditing" @change="syncEventDate"><option value="">Choose an event</option><option v-for="event in linkedEvents" :key="event.id" :value="event.id">{{ event.name }} · {{ format(event.eventDate, 'MMM d, yyyy') }}</option></select></div>
          <div class="grid gap-4 sm:grid-cols-[140px_1fr]"><AppInput id="session-number" v-model.number="form.sessionNumber" type="number" label="Session number" required /><AppInput id="session-title" v-model="form.title" label="Title" placeholder="Into Davokar" required /></div>
          <AppInput id="session-date" v-model="form.sessionDate" type="datetime-local" label="Session date" required />
        </section>

        <section class="border-t border-white/10 pt-7" aria-labelledby="party-heading"><h2 id="party-heading" class="text-lg font-bold text-white">Party</h2><div class="mt-5 grid gap-6 sm:grid-cols-2"><fieldset><legend class="app-label">Attendees</legend><div class="space-y-2"><label v-for="member in campaignMembers" :key="member.userId" class="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200"><input v-model="form.attendeeIds" type="checkbox" :value="member.userId" class="h-5 w-5 rounded border-white/20 bg-[#10131a] text-[#8b5cf6]">{{ member.displayName }}</label></div></fieldset><fieldset><legend class="app-label">Characters present</legend><div class="space-y-2"><label v-for="character in characterStore.characters" :key="character.id" class="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200"><input v-model="form.characterIds" type="checkbox" :value="character.id" class="h-5 w-5 rounded border-white/20 bg-[#10131a] text-[#8b5cf6]">{{ character.name }}</label><p v-if="!characterStore.characters.length" class="text-sm text-slate-400">No characters in the roster yet.</p></div></fieldset></div></section>

        <section class="space-y-5 border-t border-white/10 pt-7" aria-labelledby="story-heading"><h2 id="story-heading" class="text-lg font-bold text-white">The story</h2><div><label for="recap" class="app-label">Group-visible recap</label><textarea id="recap" v-model="form.recap" rows="7" class="app-field"></textarea></div><div class="grid gap-5 sm:grid-cols-2"><div><label for="progress" class="app-label">Milestone or XP progress</label><textarea id="progress" v-model="form.progress" rows="3" class="app-field"></textarea></div><div><label for="loot" class="app-label">Loot and rewards</label><textarea id="loot" v-model="form.loot" rows="3" class="app-field"></textarea></div><div><label for="quests" class="app-label">Quests and objectives</label><textarea id="quests" v-model="form.quests" rows="3" class="app-field"></textarea></div><div><label for="next-hooks" class="app-label">Next-session hooks</label><textarea id="next-hooks" v-model="form.nextSessionHooks" rows="3" class="app-field"></textarea></div></div><div><label for="memorable-moments" class="app-label">Memorable quotes and moments</label><textarea id="memorable-moments" v-model="form.memorableMoments" rows="4" class="app-field" placeholder="One moment per line"></textarea></div></section>

        <section class="space-y-3 border-t border-amber-300/20 pt-7" aria-labelledby="private-notes-heading"><div><h2 id="private-notes-heading" class="text-lg font-bold text-amber-100">Private DM notes</h2><p class="mt-1 text-sm text-amber-100/70">Stored separately and visible only to campaign DMs and table organizers.</p></div><textarea id="private-dm-notes" v-model="form.privateDmNotes" rows="6" maxlength="20000" class="app-field border-amber-300/20" aria-label="Private DM notes" placeholder="Secrets, future encounters, NPC motives, and other notes players should not see."></textarea></section>

        <div class="flex justify-end gap-3 border-t border-white/10 pt-5"><AppButton type="button" variant="secondary" @click="router.back()">Cancel</AppButton><AppButton type="submit" :loading="adventureLogStore.loading || adventureLogStore.dmNoteLoading">{{ isEditing ? 'Save entry' : 'Create entry' }}</AppButton></div>
      </form>
    </template>
  </div>
</template>
