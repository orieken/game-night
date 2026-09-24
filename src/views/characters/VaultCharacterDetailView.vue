<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { CampaignCharacterFieldDefinition } from '@/domain/entities/Campaign'
import type { CharacterFieldValue } from '@/domain/entities/Character'
import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { useAuthStore } from '@/stores/authStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useGroupStore } from '@/stores/groupStore'
import { useToastStore } from '@/stores/toastStore'
import { useVaultCharacterStore } from '@/stores/vaultCharacterStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const campaignStore = useCampaignStore()
const characterStore = useCharacterStore()
const groupStore = useGroupStore()
const toastStore = useToastStore()
const vaultStore = useVaultCharacterStore()
const selectedCampaignId = ref('')
const characterId = computed(() => typeof route.params.id === 'string' ? route.params.id : null)
const character = computed(() => vaultStore.currentCharacter)
const isOwner = computed(() => character.value?.ownerId === authStore.user?.id)
const ownerName = computed(() => groupStore.members.find((member) => member.userId === character.value?.ownerId)?.displayName ?? 'Table member')
const sourceOwnerName = computed(() => groupStore.members.find((member) => member.userId === character.value?.source?.ownerId)?.displayName ?? 'another player')
const eligibleCampaigns = computed(() => campaignStore.campaigns.filter((campaign) => campaign.status !== 'archived' && Boolean(authStore.user && (campaign.memberIds.includes(authStore.user.id) || campaign.dmIds.includes(authStore.user.id)))))
const canCopy = computed(() => Boolean(character.value && !isOwner.value && character.value.visibility === 'table' && character.value.allowCopying))

function displayValue(value: CharacterFieldValue | undefined) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

async function loadCharacter() {
  if (!groupStore.activeGroupId || !characterId.value) return
  await Promise.all([
    vaultStore.fetchCharacter(groupStore.activeGroupId, characterId.value),
    campaignStore.fetchCampaigns(groupStore.activeGroupId),
    groupStore.fetchMembers(groupStore.activeGroupId)
  ])
}

async function copyCharacter() {
  if (!groupStore.activeGroupId || !authStore.user?.id || !character.value || !canCopy.value) return
  const copied = await vaultStore.copyToVault(groupStore.activeGroupId, character.value, authStore.user.id)
  if (!copied) { toastStore.show(vaultStore.error ?? 'Unable to copy the character.', 'error'); return }
  toastStore.show('Character copied to your private vault.', 'success')
  await router.push(`/characters/${copied.id}`)
}

function sourceValue(field: CampaignCharacterFieldDefinition) {
  if (!character.value) return defaultValue(field)
  if (character.value.fieldValues[field.id] !== undefined) return character.value.fieldValues[field.id]
  const matching = character.value.fieldDefinitions.find((source) => source.label.trim().toLowerCase() === field.label.trim().toLowerCase())
  return matching ? character.value.fieldValues[matching.id] ?? defaultValue(field) : defaultValue(field)
}

function defaultValue(field: CampaignCharacterFieldDefinition): CharacterFieldValue {
  if (field.type === 'boolean') return false
  if (field.type === 'number') return null
  return ''
}

async function addToCampaign() {
  const groupId = groupStore.activeGroupId
  const userId = authStore.user?.id
  const campaign = eligibleCampaigns.value.find((item) => item.id === selectedCampaignId.value)
  if (!groupId || !userId || !character.value || !isOwner.value || !campaign) return
  const created = await characterStore.createCharacter(groupId, campaign.id, {
    name: character.value.name,
    playerId: userId,
    pronouns: character.value.pronouns,
    status: 'active',
    portraitUrl: character.value.portraitUrl,
    externalSheetUrl: character.value.externalSheetUrl,
    publicNotes: character.value.publicNotes,
    allowCopying: false,
    fieldValues: Object.fromEntries(campaign.characterFieldDefinitions.map((field) => [field.id, sourceValue(field)])),
    createdById: userId
  })
  if (!created) { toastStore.show(characterStore.error ?? 'Unable to add the character to the campaign.', 'error'); return }
  toastStore.show('Character added. Review the campaign-specific fields before playing.', 'success')
  await router.push(`/campaigns/${campaign.id}/characters/${created.id}/edit`)
}

watch([() => groupStore.activeGroupId, characterId], () => void loadCharacter(), { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-5xl">
    <LoadingState v-if="vaultStore.loading && !character" label="Opening vault character…" />
    <ErrorState v-else-if="vaultStore.error && !character" :message="vaultStore.error" @retry="loadCharacter" />
    <template v-else-if="character">
      <PageHeader :eyebrow="`${character.system} · ${character.status}`" :title="character.name" :description="`${isOwner ? 'Your vault character' : `Created by ${ownerName}`}${character.pronouns ? ` · ${character.pronouns}` : ''}`">
        <template #actions><AppButton variant="secondary" @click="router.push('/characters')">Back to vault</AppButton><AppButton v-if="isOwner" @click="router.push(`/characters/${character.id}/edit`)">Edit character</AppButton><AppButton v-else-if="canCopy" @click="copyCharacter">Copy to my vault</AppButton></template>
      </PageHeader>
      <div class="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside class="space-y-4"><section class="overflow-hidden rounded-2xl border border-white/10 bg-[#181d27]"><img v-if="character.portraitUrl" :src="character.portraitUrl" :alt="character.name" class="aspect-square w-full object-cover"><div v-else class="grid aspect-square w-full place-items-center bg-[#8b5cf6]/10 text-6xl font-black text-[#c4b5fd]" aria-hidden="true">{{ character.name.slice(0, 2).toUpperCase() }}</div><dl class="grid grid-cols-2 gap-3 border-t border-white/10 p-5 text-sm"><div><dt class="text-xs uppercase tracking-wider text-slate-400">Visibility</dt><dd class="mt-1 font-semibold capitalize text-white">{{ character.visibility }}</dd></div><div><dt class="text-xs uppercase tracking-wider text-slate-400">Copying</dt><dd class="mt-1 font-semibold text-white">{{ character.allowCopying ? 'Allowed' : 'Not allowed' }}</dd></div></dl></section><a v-if="character.externalSheetUrl" :href="character.externalSheetUrl" target="_blank" rel="noreferrer" class="flex min-h-11 items-center justify-center rounded-xl border border-[#57d2a4]/30 bg-[#57d2a4]/10 px-4 py-2 text-sm font-bold text-[#57d2a4]">Open external sheet ↗</a></aside>
        <div class="space-y-6"><section class="rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8"><h2 class="text-lg font-bold text-white">About {{ character.name }}</h2><p class="mt-3 whitespace-pre-wrap leading-7 text-slate-300">{{ character.publicNotes || 'No table-visible notes have been added.' }}</p><p v-if="character.source" class="mt-5 border-t border-white/10 pt-4 text-xs text-slate-400">Based on {{ character.source.characterName }} by {{ sourceOwnerName }}.</p></section><section v-if="character.fieldDefinitions.length" class="rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8"><h2 class="text-lg font-bold text-white">{{ character.system }} details</h2><dl class="mt-5 grid gap-3 sm:grid-cols-2"><div v-for="field in character.fieldDefinitions" :key="field.id" class="rounded-xl border border-white/10 bg-white/[0.03] p-4"><dt class="text-xs font-semibold uppercase tracking-wider text-slate-400">{{ field.label }}</dt><dd class="mt-2 whitespace-pre-wrap font-medium text-white">{{ displayValue(character.fieldValues[field.id]) }}</dd></div></dl></section><section v-if="isOwner" class="rounded-2xl border border-[#57d2a4]/20 bg-[#57d2a4]/5 p-6"><h2 class="font-bold text-white">Add to a campaign</h2><p class="mt-2 text-sm text-slate-400">This creates an independent campaign sheet and carries over matching fields.</p><div v-if="eligibleCampaigns.length" class="mt-4 flex flex-col gap-3 sm:flex-row"><select v-model="selectedCampaignId" class="app-field" aria-label="Campaign"><option value="">Choose a campaign</option><option v-for="campaign in eligibleCampaigns" :key="campaign.id" :value="campaign.id">{{ campaign.name }}</option></select><AppButton :disabled="!selectedCampaignId" :loading="characterStore.loading" @click="addToCampaign">Add to campaign</AppButton></div><p v-else class="mt-4 text-sm text-slate-400">Join or create an active campaign before adding this character.</p></section></div>
      </div>
    </template>
    <EmptyState v-else icon="?" title="Character not found" description="This character may be private or no longer available."><template #actions><AppButton variant="secondary" @click="router.push('/characters')">Back to vault</AppButton></template></EmptyState>
  </div>
</template>
