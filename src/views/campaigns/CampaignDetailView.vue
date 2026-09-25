<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { useGroupStore } from '@/stores/groupStore'
import { useToastStore } from '@/stores/toastStore'
import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { useGameNightStore } from '@/stores/gameNightStore'
import { format } from 'date-fns'
import { useCharacterStore } from '@/stores/characterStore'
import CharacterCard from '@/components/campaign/CharacterCard.vue'
import { useAdventureLogStore } from '@/stores/adventureLogStore'
import AdventureLogCard from '@/components/campaign/AdventureLogCard.vue'
import { calculateCampaignStatistics } from '@/domain/campaignStatistics'
import { useGameStore } from '@/stores/gameStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const campaignStore = useCampaignStore()
const groupStore = useGroupStore()
const toastStore = useToastStore()
const gameNightStore = useGameNightStore()
const characterStore = useCharacterStore()
const adventureLogStore = useAdventureLogStore()
const gameStore = useGameStore()
const confirmingArchive = ref(false)
const campaign = computed(() => campaignStore.currentCampaign)
const memberRole = computed(() => groupStore.members.find((member) => member.userId === authStore.user?.id)?.role)
const isOrganizer = computed(() => memberRole.value === 'owner' || memberRole.value === 'organizer')
const isParticipant = computed(() => Boolean(campaign.value && authStore.user && (
  campaign.value.memberIds.includes(authStore.user.id) || campaign.value.dmIds.includes(authStore.user.id)
)))
const canManage = computed(() => isOrganizer.value || Boolean(campaign.value?.dmIds.includes(authStore.user?.id ?? '')))
const canViewRoster = computed(() => isOrganizer.value || isParticipant.value)
const canCreateCharacter = computed(() => isParticipant.value && campaign.value?.status !== 'archived')
const dms = computed(() => groupStore.members.filter((member) => campaign.value?.dmIds.includes(member.userId)))
const players = computed(() => groupStore.members.filter((member) => campaign.value?.memberIds.includes(member.userId)))
const linkedGame = computed(() => gameStore.games.find((game) => game.id === campaign.value?.gameId) ?? null)
const linkedEvents = computed(() => gameNightStore.gameNights
  .filter((event) => event.campaignId === campaign.value?.id)
  .sort((left, right) => left.eventDate.getTime() - right.eventDate.getTime()))
const statistics = computed(() => calculateCampaignStatistics(adventureLogStore.logs))
const attendanceRows = computed(() => statistics.value.attendance.map((item) => ({
  ...item,
  name: groupStore.members.find((member) => member.userId === item.userId)?.displayName ?? 'Former campaign member'
})))

async function loadCampaign() {
  const groupId = groupStore.activeGroupId
  const id = route.params.id
  confirmingArchive.value = false
  characterStore.reset()
  adventureLogStore.reset()
  if (groupId && typeof id === 'string') {
    await Promise.all([
      campaignStore.fetchCampaignById(groupId, id),
      groupStore.fetchMembers(groupId),
      gameNightStore.fetchGameNights(groupId),
      gameStore.fetchGames(groupId)
    ])
    if (canViewRoster.value) await Promise.all([
      characterStore.fetchCharacters(groupId, id),
      adventureLogStore.fetchLogs(groupId, id)
    ])
  }
}

async function archiveCampaign() {
  if (!campaign.value || !groupStore.activeGroupId || !canManage.value) return
  const archived = await campaignStore.archiveCampaign(groupStore.activeGroupId, campaign.value.id)
  confirmingArchive.value = false
  if (archived) toastStore.show('Campaign archived.', 'success')
  else toastStore.show(campaignStore.error ?? 'Unable to archive the campaign.', 'error')
}

watch([() => groupStore.activeGroupId, () => route.params.id], loadCampaign, { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-5xl">
    <LoadingState v-if="campaignStore.loading && !campaign" label="Loading campaign…" />
    <ErrorState v-else-if="campaignStore.error && !campaign" :message="campaignStore.error" @retry="loadCampaign" />
    <template v-else-if="campaign">
      <PageHeader :eyebrow="campaign.status.replace('_', ' ')" :title="campaign.name" :description="campaign.variant ? `${campaign.system} · ${campaign.variant}` : campaign.system">
        <template #actions><AppButton variant="secondary" @click="router.push('/campaigns')">Back</AppButton><AppButton v-if="canManage" @click="router.push(`/campaigns/${campaign.id}/edit`)">Edit campaign</AppButton></template>
      </PageHeader>
      <ErrorState v-if="campaignStore.error" class="mb-6" :message="campaignStore.error" :retryable="false" />
      <div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div class="space-y-6">
          <section class="rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8">
            <h2 class="text-lg font-bold text-white">About this campaign</h2>
            <p class="mt-3 whitespace-pre-wrap leading-7 text-slate-300">{{ campaign.description || 'No campaign description has been added yet.' }}</p>
          </section>
          <section v-if="canViewRoster" class="rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8" aria-labelledby="campaign-statistics-heading">
            <div><h2 id="campaign-statistics-heading" class="text-lg font-bold text-white">Campaign history and attendance</h2><p class="mt-1 text-sm text-slate-400">Campaign activity is tracked here and does not affect the board-game leaderboard.</p></div>
            <dl class="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4"><div class="rounded-xl bg-white/[0.04] p-4"><dt class="text-xs uppercase tracking-wider text-slate-400">Recorded sessions</dt><dd class="mt-2 text-2xl font-black text-white">{{ statistics.recordedSessions }}</dd></div><div class="rounded-xl bg-white/[0.04] p-4"><dt class="text-xs uppercase tracking-wider text-slate-400">Total attendances</dt><dd class="mt-2 text-2xl font-black text-[#57d2a4]">{{ statistics.totalAttendances }}</dd></div><div class="rounded-xl bg-white/[0.04] p-4"><dt class="text-xs uppercase tracking-wider text-slate-400">Players joined</dt><dd class="mt-2 text-2xl font-black text-[#c4b5fd]">{{ statistics.uniquePlayers }}</dd></div><div class="rounded-xl bg-white/[0.04] p-4"><dt class="text-xs uppercase tracking-wider text-slate-400">Characters seen</dt><dd class="mt-2 text-2xl font-black text-[#ff877c]">{{ statistics.uniqueCharacters }}</dd></div></dl>
            <div v-if="statistics.recordedSessions" class="mt-5 grid gap-5 border-t border-white/10 pt-5 sm:grid-cols-2"><div><h3 class="text-sm font-bold text-white">Attendance by player</h3><ul class="mt-3 space-y-2"><li v-for="item in attendanceRows" :key="item.userId" class="flex justify-between rounded-xl bg-white/[0.04] px-4 py-3 text-sm"><span class="text-slate-200">{{ item.name }}</span><span class="font-semibold text-[#57d2a4]">{{ item.sessions }} {{ item.sessions === 1 ? 'session' : 'sessions' }}</span></li></ul></div><div><h3 class="text-sm font-bold text-white">Latest recorded session</h3><p class="mt-3 rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-slate-300">{{ statistics.latestSessionDate ? format(statistics.latestSessionDate, 'MMMM d, yyyy') : 'No sessions yet' }}</p></div></div>
          </section>
          <section class="rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8">
            <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div><h2 class="text-lg font-bold text-white">Character roster</h2><p class="mt-1 text-sm text-slate-400">{{ campaign.kind === 'campaign_board_game' ? 'Player-owned and table-owned heroes for this campaign.' : 'Player-managed sheets for this campaign.' }}</p></div>
              <AppButton v-if="canCreateCharacter" @click="router.push(`/campaigns/${campaign.id}/characters/new`)">Create character</AppButton>
            </div>
            <LoadingState v-if="characterStore.loading" class="mt-5" label="Loading character roster…" />
            <ErrorState v-else-if="characterStore.error" class="mt-5" :message="characterStore.error" :retryable="false" />
            <p v-else-if="!canViewRoster" class="mt-5 rounded-xl bg-white/5 p-4 text-sm text-slate-400">The character roster is visible to campaign participants.</p>
            <p v-else-if="!characterStore.characters.length" class="mt-5 rounded-xl bg-white/5 p-4 text-sm text-slate-400">No characters have joined this campaign yet.</p>
            <div v-else class="mt-5 grid gap-3 sm:grid-cols-2">
              <CharacterCard v-for="item in characterStore.characters" :key="item.id" :character="item" :campaign-id="campaign.id" :player-name="groupStore.members.find((member) => member.userId === (item.ownershipType === 'table' ? item.controllerId : item.playerId))?.displayName ?? (item.ownershipType === 'table' ? 'Unassigned' : 'Campaign player')" />
            </div>
          </section>
          <section class="rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8">
            <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div><h2 class="text-lg font-bold text-white">Adventure log</h2><p class="mt-1 text-sm text-slate-400">Recaps, party progress, memorable moments, and what comes next.</p></div>
              <AppButton v-if="canManage && campaign.status !== 'archived'" @click="router.push(`/campaigns/${campaign.id}/adventure-logs/new`)">Record adventure</AppButton>
            </div>
            <LoadingState v-if="adventureLogStore.loading" class="mt-5" label="Loading adventure log…" />
            <ErrorState v-else-if="adventureLogStore.error" class="mt-5" :message="adventureLogStore.error" :retryable="false" />
            <p v-else-if="!canViewRoster" class="mt-5 rounded-xl bg-white/5 p-4 text-sm text-slate-400">Adventure entries are visible to campaign participants.</p>
            <p v-else-if="!adventureLogStore.logs.length" class="mt-5 rounded-xl bg-white/5 p-4 text-sm text-slate-400">No adventures have been recorded yet.</p>
            <div v-else class="mt-5 grid gap-3 sm:grid-cols-2"><AdventureLogCard v-for="entry in adventureLogStore.logs" :key="entry.id" :log="entry" :campaign-id="campaign.id" /></div>
          </section>
          <section class="rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8">
            <h2 class="text-lg font-bold text-white">Character setup</h2>
            <p v-if="!campaign.characterFieldDefinitions.length" class="mt-3 text-sm text-slate-400">This campaign uses the standard character summary without additional fields.</p>
            <ul v-else class="mt-4 grid gap-3 sm:grid-cols-2">
              <li v-for="field in campaign.characterFieldDefinitions" :key="field.id" class="rounded-xl border border-white/10 bg-white/[0.03] p-4"><p class="font-semibold text-white">{{ field.label }}<span v-if="field.required" class="ml-1 text-[#ff6b5e]">*</span></p><p class="mt-1 text-xs capitalize text-slate-400">{{ field.type.replace('_', ' ') }}<template v-if="field.options.length"> · {{ field.options.join(', ') }}</template></p></li>
            </ul>
          </section>
          <section v-if="campaign.externalLinks.length" class="rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8">
            <h2 class="text-lg font-bold text-white">Campaign links</h2>
            <ul class="mt-4 space-y-2"><li v-for="link in campaign.externalLinks" :key="link.url"><a :href="link.url" target="_blank" rel="noreferrer" class="inline-flex min-h-11 items-center font-semibold text-[#57d2a4] hover:text-[#85e4c3]">{{ link.label }} ↗</a></li></ul>
          </section>
          <section class="rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8">
            <h2 class="text-lg font-bold text-white">Scheduled sessions</h2>
            <p v-if="!linkedEvents.length" class="mt-3 text-sm text-slate-400">No game nights are linked to this campaign yet.</p>
            <ul v-else class="mt-4 space-y-3">
              <li v-for="event in linkedEvents" :key="event.id"><RouterLink :to="`/game-nights/${event.id}`" class="flex min-h-11 items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-[#57d2a4]/40"><span><strong class="block text-white">{{ event.name }}</strong><span class="mt-1 block text-xs text-slate-400">{{ format(event.eventDate, 'MMM d, yyyy · h:mm a') }}</span></span><span class="text-xs uppercase tracking-wider text-[#57d2a4]">{{ event.status.replace('_', ' ') }}</span></RouterLink></li>
            </ul>
          </section>
        </div>
        <aside class="space-y-6">
          <section v-if="linkedGame" class="rounded-2xl border border-white/10 bg-[#181d27] p-6"><h2 class="font-bold text-white">Linked game</h2><RouterLink :to="`/games/${linkedGame.id}`" class="mt-3 block rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-[#57d2a4] hover:bg-white/10">{{ linkedGame.name }} →</RouterLink></section>
          <section class="rounded-2xl border border-white/10 bg-[#181d27] p-6">
            <h2 class="font-bold text-white">{{ campaign.kind === 'campaign_board_game' ? 'Campaign managers' : 'Dungeon masters' }}</h2>
            <ul class="mt-3 space-y-2"><li v-for="member in dms" :key="member.userId" class="rounded-xl bg-white/5 px-4 py-3 text-sm text-slate-200">{{ member.displayName }}</li></ul>
          </section>
          <section class="rounded-2xl border border-white/10 bg-[#181d27] p-6">
            <h2 class="font-bold text-white">Campaign members</h2>
            <ul class="mt-3 space-y-2"><li v-for="member in players" :key="member.userId" class="rounded-xl bg-white/5 px-4 py-3 text-sm text-slate-200">{{ member.displayName }}</li></ul>
          </section>
          <section v-if="canManage && campaign.status !== 'archived'" class="rounded-2xl border border-red-500/15 bg-red-500/5 p-6">
            <template v-if="!confirmingArchive"><h2 class="font-bold text-white">Archive campaign</h2><p class="mt-2 text-sm leading-6 text-slate-400">Keep its history while removing it from the active campaign list.</p><AppButton class="mt-4" variant="danger" @click="confirmingArchive = true">Archive campaign</AppButton></template>
            <template v-else><h2 class="font-bold text-red-100">Archive {{ campaign.name }}?</h2><div class="mt-4 flex flex-wrap gap-3"><AppButton variant="danger" :loading="campaignStore.loading" @click="archiveCampaign">Yes, archive</AppButton><AppButton variant="secondary" @click="confirmingArchive = false">Keep active</AppButton></div></template>
          </section>
        </aside>
      </div>
    </template>
    <EmptyState v-else icon="?" title="Campaign not found" description="This campaign may not exist or may belong to another table."><template #actions><AppButton variant="secondary" @click="router.push('/campaigns')">Back to campaigns</AppButton></template></EmptyState>
  </div>
</template>
