<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { format } from 'date-fns'
import { useRoute, useRouter } from 'vue-router'
import { useAdventureLogStore } from '@/stores/adventureLogStore'
import { useAuthStore } from '@/stores/authStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useGameNightStore } from '@/stores/gameNightStore'
import { useGroupStore } from '@/stores/groupStore'
import { usePublicStoryHighlightStore } from '@/stores/publicStoryHighlightStore'
import { useToastStore } from '@/stores/toastStore'
import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
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
const storyStore = usePublicStoryHighlightStore()
const toastStore = useToastStore()
const storyText = ref('')
const campaignId = computed(() => typeof route.params.campaignId === 'string' ? route.params.campaignId : null)
const logId = computed(() => typeof route.params.logId === 'string' ? route.params.logId : null)
const campaign = computed(() => campaignStore.currentCampaign)
const log = computed(() => adventureLogStore.currentLog)
const memberRole = computed(() => groupStore.members.find((member) => member.userId === authStore.user?.id)?.role)
const canManage = computed(() => memberRole.value === 'owner' || memberRole.value === 'organizer' || Boolean(campaign.value?.dmIds.includes(authStore.user?.id ?? '')))
const linkedEvent = computed(() => gameNightStore.gameNights.find((event) => event.id === log.value?.eventId) ?? null)
const attendeeNames = computed(() => groupStore.members.filter((member) => log.value?.attendeeIds.includes(member.userId)).map((member) => member.displayName))
const presentCharacters = computed(() => characterStore.characters.filter((character) => log.value?.characterIds.includes(character.id)))
const publicStoryPath = computed(() => groupStore.activeGroupId && campaignId.value && logId.value ? `/stories/${groupStore.activeGroupId}/${campaignId.value}/${logId.value}` : null)

async function loadLog() {
  const groupId = groupStore.activeGroupId
  if (!groupId || !campaignId.value || !logId.value) return
  storyStore.reset()
  storyText.value = ''
  await Promise.all([
    campaignStore.fetchCampaignById(groupId, campaignId.value),
    adventureLogStore.fetchLogById(groupId, campaignId.value, logId.value),
    characterStore.fetchCharacters(groupId, campaignId.value),
    gameNightStore.fetchGameNights(groupId),
    groupStore.fetchMembers(groupId)
  ])
  if (canManage.value) {
    await Promise.all([
      adventureLogStore.fetchDmNote(groupId, campaignId.value, logId.value),
      storyStore.fetchForSession(groupId, campaignId.value, logId.value)
    ])
    storyText.value = storyStore.currentHighlight?.excerpt ?? ''
  }
}

async function publishStory() {
  const groupId = groupStore.activeGroupId
  const userId = authStore.user?.id
  if (!groupId || !userId || !campaign.value || !log.value || !canManage.value || !storyText.value.trim()) return
  const published = await storyStore.publish({
    groupId,
    campaignId: campaign.value.id,
    adventureLogId: log.value.id,
    campaignName: campaign.value.name,
    sessionNumber: log.value.sessionNumber,
    title: log.value.title,
    sessionDate: log.value.sessionDate,
    excerpt: storyText.value.trim(),
    publishedById: userId
  })
  if (published) toastStore.show('Public story highlight published.', 'success')
  else toastStore.show(storyStore.error ?? 'Unable to publish the story highlight.', 'error')
}

async function unpublishStory() {
  const groupId = groupStore.activeGroupId
  const userId = authStore.user?.id
  if (!groupId || !userId || !campaign.value || !log.value || !canManage.value) return
  const unpublished = await storyStore.unpublish(groupId, campaign.value.id, log.value.id, userId)
  if (unpublished) toastStore.show('Public story highlight unpublished.', 'success')
  else toastStore.show(storyStore.error ?? 'Unable to unpublish the story highlight.', 'error')
}

watch([() => groupStore.activeGroupId, campaignId, logId], () => void loadLog(), { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-5xl">
    <LoadingState v-if="adventureLogStore.loading && !log" label="Opening adventure log…" />
    <ErrorState v-else-if="campaignStore.error || adventureLogStore.error && !log" :message="campaignStore.error ?? adventureLogStore.error ?? 'Unable to load the adventure entry.'" @retry="loadLog" />
    <template v-else-if="campaign && log">
      <PageHeader :eyebrow="`Session ${log.sessionNumber} · ${format(log.sessionDate, 'MMMM d, yyyy')}`" :title="log.title" :description="campaign.name">
        <template #actions><AppButton variant="secondary" @click="router.push(`/campaigns/${campaign.id}`)">Back to campaign</AppButton><AppButton v-if="canManage && campaign.status !== 'archived'" @click="router.push(`/campaigns/${campaign.id}/adventure-logs/${log.id}/edit`)">Edit entry</AppButton></template>
      </PageHeader>
      <div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div class="space-y-6">
          <section class="rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8"><h2 class="text-lg font-bold text-white">Adventure recap</h2><p class="mt-4 whitespace-pre-wrap leading-7 text-slate-300">{{ log.recap || 'No recap has been added yet.' }}</p></section>
          <section class="grid gap-4 sm:grid-cols-2"><div class="rounded-2xl border border-white/10 bg-[#181d27] p-6"><h2 class="font-bold text-white">Progress</h2><p class="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{{ log.progress || 'No milestone or XP progress recorded.' }}</p></div><div class="rounded-2xl border border-white/10 bg-[#181d27] p-6"><h2 class="font-bold text-white">Loot and rewards</h2><p class="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{{ log.loot || 'No loot recorded.' }}</p></div><div class="rounded-2xl border border-white/10 bg-[#181d27] p-6"><h2 class="font-bold text-white">Quests and objectives</h2><p class="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{{ log.quests || 'No quests recorded.' }}</p></div><div class="rounded-2xl border border-white/10 bg-[#181d27] p-6"><h2 class="font-bold text-white">Next-session hooks</h2><p class="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{{ log.nextSessionHooks || 'No hooks recorded.' }}</p></div></section>
          <section v-if="log.memorableMoments.length" class="rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8"><h2 class="text-lg font-bold text-white">Memorable moments</h2><ul class="mt-4 space-y-3"><li v-for="moment in log.memorableMoments" :key="moment" class="rounded-xl border border-[#8b5cf6]/20 bg-[#8b5cf6]/5 p-4 text-slate-200">“{{ moment }}”</li></ul></section>
          <section v-if="canManage" class="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-6 sm:p-8"><div class="flex flex-wrap items-center justify-between gap-2"><h2 class="text-lg font-bold text-amber-100">Private DM notes</h2><span class="rounded-full bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">DMs and organizers only</span></div><LoadingState v-if="adventureLogStore.dmNoteLoading" class="mt-4" label="Loading private notes…" /><p v-else class="mt-4 whitespace-pre-wrap leading-7 text-amber-50/80">{{ adventureLogStore.currentDmNote?.body || 'No private notes have been added.' }}</p></section>
          <section v-if="canManage" class="rounded-2xl border border-[#57d2a4]/20 bg-[#57d2a4]/5 p-6 sm:p-8"><div class="flex flex-wrap items-center justify-between gap-2"><div><h2 class="text-lg font-bold text-white">Public story highlight</h2><p class="mt-1 text-sm text-slate-400">Only this short text and the session heading will be public. The recap and DM notes remain private.</p></div><span v-if="storyStore.currentHighlight?.published" class="rounded-full bg-[#57d2a4]/15 px-3 py-1 text-xs font-semibold text-[#57d2a4]">Published</span></div><textarea v-model="storyText" rows="5" maxlength="500" class="app-field mt-5" aria-label="Public story highlight" placeholder="A spoiler-safe moment from this session…"></textarea><div class="mt-4 flex flex-wrap items-center gap-3"><AppButton :disabled="!storyText.trim()" :loading="storyStore.loading" @click="publishStory">{{ storyStore.currentHighlight?.published ? 'Update public story' : 'Publish story' }}</AppButton><AppButton v-if="storyStore.currentHighlight?.published" variant="secondary" :loading="storyStore.loading" @click="unpublishStory">Unpublish</AppButton><RouterLink v-if="storyStore.currentHighlight?.published && publicStoryPath" :to="publicStoryPath" target="_blank" class="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-[#57d2a4]">View public page ↗</RouterLink><span class="ml-auto text-xs text-slate-500">{{ storyText.length }}/500</span></div></section>
        </div>
        <aside class="space-y-6">
          <section class="rounded-2xl border border-white/10 bg-[#181d27] p-6"><h2 class="font-bold text-white">Linked game night</h2><RouterLink v-if="linkedEvent" :to="`/game-nights/${linkedEvent.id}`" class="mt-3 block rounded-xl bg-white/5 p-4 text-sm font-semibold text-[#57d2a4] hover:bg-white/10">{{ linkedEvent.name }}<span class="mt-1 block text-xs font-normal text-slate-400">{{ format(linkedEvent.eventDate, 'MMM d, yyyy · h:mm a') }}</span></RouterLink></section>
          <section class="rounded-2xl border border-white/10 bg-[#181d27] p-6"><h2 class="font-bold text-white">Attendees</h2><ul v-if="attendeeNames.length" class="mt-3 space-y-2"><li v-for="name in attendeeNames" :key="name" class="rounded-xl bg-white/5 px-4 py-3 text-sm text-slate-200">{{ name }}</li></ul><p v-else class="mt-3 text-sm text-slate-400">No attendees recorded.</p></section>
          <section class="rounded-2xl border border-white/10 bg-[#181d27] p-6"><h2 class="font-bold text-white">Characters present</h2><ul v-if="presentCharacters.length" class="mt-3 space-y-2"><li v-for="character in presentCharacters" :key="character.id"><RouterLink :to="`/campaigns/${campaign.id}/characters/${character.id}`" class="block rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-[#c4b5fd] hover:bg-white/10">{{ character.name }}</RouterLink></li></ul><p v-else class="mt-3 text-sm text-slate-400">No characters recorded.</p></section>
        </aside>
      </div>
    </template>
    <EmptyState v-else icon="?" title="Adventure entry not found" description="This entry may not exist or you may not have access to its campaign."><template #actions><AppButton variant="secondary" @click="router.push(campaignId ? `/campaigns/${campaignId}` : '/campaigns')">Back to campaign</AppButton></template></EmptyState>
  </div>
</template>
