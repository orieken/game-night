<script setup lang="ts">
import { computed, watch } from 'vue'
import { format } from 'date-fns'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import CharacterCard from '@/components/campaign/CharacterCard.vue'
import VaultCharacterCard from '@/components/characters/VaultCharacterCard.vue'
import { useAuthStore } from '@/stores/authStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { useGroupStore } from '@/stores/groupStore'
import { useLeaderboardStore } from '@/stores/leaderboardStore'
import { useVaultCharacterStore } from '@/stores/vaultCharacterStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const campaignStore = useCampaignStore()
const groupStore = useGroupStore()
const leaderboardStore = useLeaderboardStore()
const vaultStore = useVaultCharacterStore()
const targetUserId = computed(() => typeof route.params.userId === 'string' ? route.params.userId : authStore.user?.id ?? null)
const isOwnProfile = computed(() => targetUserId.value === authStore.user?.id)
const member = computed(() => groupStore.members.find((item) => item.userId === targetUserId.value) ?? null)
const viewerRole = computed(() => groupStore.members.find((item) => item.userId === authStore.user?.id)?.role)
const viewerIsOrganizer = computed(() => viewerRole.value === 'owner' || viewerRole.value === 'organizer')
const leaderboardIndex = computed(() => leaderboardStore.entries.findIndex((item) => item.userId === targetUserId.value))
const stats = computed(() => {
  const entry = leaderboardIndex.value >= 0 ? leaderboardStore.entries[leaderboardIndex.value] : null
  const totalPlays = entry?.totalPlays ?? 0
  const totalWins = entry?.totalWins ?? 0
  return { totalPlays, totalWins, points: entry?.points ?? 0, rank: entry ? leaderboardIndex.value + 1 : null, winRate: totalPlays ? Math.round((totalWins / totalPlays) * 100) : 0 }
})
const displayName = computed(() => isOwnProfile.value ? authStore.user?.displayName ?? authStore.user?.username ?? 'Player' : member.value?.displayName ?? 'Player')
const initials = computed(() => displayName.value.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase())
const avatarUrl = computed(() => isOwnProfile.value ? authStore.user?.avatarUrl : member.value?.avatarUrl)
const profileVaultCharacters = computed(() => isOwnProfile.value ? vaultStore.ownedCharacters : vaultStore.sharedCharacters.filter((character) => character.ownerId === targetUserId.value))
const loading = computed(() => groupStore.membersLoading || leaderboardStore.loading || campaignStore.loading || vaultStore.loading)
const error = computed(() => groupStore.membersError ?? leaderboardStore.error ?? campaignStore.error ?? vaultStore.error)

async function loadProfile() {
  const groupId = groupStore.activeGroupId
  const viewerId = authStore.user?.id
  if (!groupId || !viewerId || !targetUserId.value) return
  await Promise.all([groupStore.fetchMembers(groupId), leaderboardStore.fetchLeaderboard(groupId), campaignStore.fetchCampaigns(groupId), vaultStore.fetchVault(groupId, viewerId)])
  await vaultStore.fetchProfileCampaignCharacters(groupId, campaignStore.campaigns, targetUserId.value, viewerId, viewerIsOrganizer.value)
}

watch([() => groupStore.activeGroupId, targetUserId], () => void loadProfile(), { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-5xl">
    <PageHeader :eyebrow="isOwnProfile ? 'Your player profile' : 'Table player'" :title="isOwnProfile ? 'Profile' : displayName" :description="`${isOwnProfile ? 'Your' : `${displayName}’s`} stats and characters for ${groupStore.activeGroup?.name ?? 'the active table'}.`" />
    <LoadingState v-if="loading && !member" label="Loading player profile…" />
    <ErrorState v-else-if="error" :message="error" @retry="loadProfile" />
    <div v-else-if="member" class="space-y-9">
      <section class="overflow-hidden rounded-3xl border border-white/10 bg-[#181d27]"><div class="h-24 bg-gradient-to-r from-[#33255e] via-[#253453] to-[#174638]"></div><div class="px-6 pb-7 sm:px-8"><div class="-mt-10 flex flex-col gap-5 sm:flex-row sm:items-end"><img v-if="avatarUrl" :src="avatarUrl" :alt="`${displayName} avatar`" class="h-20 w-20 rounded-2xl border-4 border-[#181d27] object-cover"><div v-else class="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border-4 border-[#181d27] bg-[#57d2a4] text-xl font-black text-[#10131a]" aria-hidden="true">{{ initials }}</div><div class="min-w-0 flex-1 pb-1"><div class="flex flex-wrap items-center gap-3"><h1 class="display-title truncate text-2xl font-bold text-white">{{ displayName }}</h1><span class="rounded-full bg-[#8b5cf6]/15 px-3 py-1 text-xs font-semibold capitalize text-[#bda7ff]">{{ member.role }}</span></div><p v-if="isOwnProfile" class="mt-1 text-sm text-slate-400">{{ authStore.user?.email }}</p></div></div><p v-if="isOwnProfile && authStore.user?.bio" class="mt-5 max-w-2xl text-sm leading-6 text-slate-300">{{ authStore.user.bio }}</p><div class="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400"><span v-if="isOwnProfile">@{{ authStore.user?.username }}</span><span>Joined this table {{ format(member.joinedAt, 'MMMM d, yyyy') }}</span><span v-if="isOwnProfile && authStore.user">Account created {{ format(authStore.user.createdAt, 'MMMM yyyy') }}</span></div></div></section>
      <section aria-labelledby="player-stats-heading"><div class="mb-4 flex items-end justify-between gap-4"><div><p class="text-xs font-semibold uppercase tracking-[0.16em] text-[#57d2a4]">Active table</p><h2 id="player-stats-heading" class="mt-1 text-xl font-bold text-white">Player stats</h2></div><RouterLink to="/leaderboard" class="text-sm font-semibold text-[#bda7ff] hover:text-white">View leaderboard</RouterLink></div><dl class="grid grid-cols-2 gap-3 lg:grid-cols-5"><div class="rounded-2xl border border-white/10 bg-[#181d27] p-5"><dt class="text-xs uppercase tracking-wider text-slate-400">Points</dt><dd class="mt-2 text-3xl font-black tabular-nums text-[#ff6b5e]">{{ stats.points }}</dd></div><div class="rounded-2xl border border-white/10 bg-[#181d27] p-5"><dt class="text-xs uppercase tracking-wider text-slate-400">Wins</dt><dd class="mt-2 text-3xl font-black tabular-nums text-white">{{ stats.totalWins }}</dd></div><div class="rounded-2xl border border-white/10 bg-[#181d27] p-5"><dt class="text-xs uppercase tracking-wider text-slate-400">Games</dt><dd class="mt-2 text-3xl font-black tabular-nums text-white">{{ stats.totalPlays }}</dd></div><div class="rounded-2xl border border-white/10 bg-[#181d27] p-5"><dt class="text-xs uppercase tracking-wider text-slate-400">Win rate</dt><dd class="mt-2 text-3xl font-black tabular-nums text-[#57d2a4]">{{ stats.winRate }}%</dd></div><div class="col-span-2 rounded-2xl border border-white/10 bg-[#181d27] p-5 lg:col-span-1"><dt class="text-xs uppercase tracking-wider text-slate-400">Rank</dt><dd class="mt-2 text-3xl font-black tabular-nums text-[#bda7ff]">{{ stats.rank ? `#${stats.rank}` : '—' }}</dd></div></dl></section>
      <section aria-labelledby="profile-campaign-characters"><div class="mb-4"><h2 id="profile-campaign-characters" class="text-xl font-bold text-white">Current characters</h2><p class="mt-1 text-sm text-slate-400">Characters from campaigns you have permission to view.</p></div><div v-if="vaultStore.profileCampaignCharacters.length" class="grid gap-4 sm:grid-cols-2"><CharacterCard v-for="item in vaultStore.profileCampaignCharacters" :key="`${item.campaign.id}-${item.character.id}`" :character="item.character" :campaign-id="item.campaign.id" :player-name="displayName" /></div><p v-else class="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">No visible campaign characters yet.</p></section>
      <section aria-labelledby="profile-vault-characters"><div class="mb-4 flex items-end justify-between gap-4"><div><h2 id="profile-vault-characters" class="text-xl font-bold text-white">Character vault</h2><p class="mt-1 text-sm text-slate-400">{{ isOwnProfile ? 'Your private drafts and table-visible characters.' : 'Characters this player has shared with the table.' }}</p></div><AppButton v-if="isOwnProfile" @click="router.push('/characters/new')">Create character</AppButton></div><div v-if="profileVaultCharacters.length" class="grid gap-4 sm:grid-cols-2"><VaultCharacterCard v-for="character in profileVaultCharacters" :key="character.id" :character="character" :owner-name="isOwnProfile ? 'Your character' : `Created by ${displayName}`" /></div><p v-else class="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">{{ isOwnProfile ? 'Your vault is empty.' : 'No table-visible vault characters have been shared.' }}</p></section>
    </div>
    <ErrorState v-else message="This player is not a member of the active table." :retryable="false" />
  </div>
</template>
