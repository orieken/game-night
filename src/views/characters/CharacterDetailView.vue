<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { CharacterFieldValue } from '@/domain/entities/Character'
import { useAuthStore } from '@/stores/authStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useGroupStore } from '@/stores/groupStore'
import { useToastStore } from '@/stores/toastStore'
import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import PageHeader from '@/components/common/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const campaignStore = useCampaignStore()
const characterStore = useCharacterStore()
const groupStore = useGroupStore()
const toastStore = useToastStore()
const confirmingRetirement = ref(false)
const campaignId = computed(() => typeof route.params.campaignId === 'string' ? route.params.campaignId : null)
const characterId = computed(() => typeof route.params.characterId === 'string' ? route.params.characterId : null)
const campaign = computed(() => campaignStore.currentCampaign)
const character = computed(() => characterStore.currentCharacter)
const isOwner = computed(() => character.value?.playerId === authStore.user?.id)
const playerName = computed(() => groupStore.members.find((member) => member.userId === character.value?.playerId)?.displayName ?? 'Campaign player')
const initials = computed(() => character.value?.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() ?? '?')

function displayValue(value: CharacterFieldValue | undefined) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value === null || value === undefined || value === '') return 'Not provided'
  return String(value)
}

async function loadCharacter() {
  confirmingRetirement.value = false
  const groupId = groupStore.activeGroupId
  if (!groupId || !campaignId.value || !characterId.value) return
  await Promise.all([
    campaignStore.fetchCampaignById(groupId, campaignId.value),
    characterStore.fetchCharacterById(groupId, campaignId.value, characterId.value),
    groupStore.fetchMembers(groupId)
  ])
}

async function retireCharacter() {
  if (!groupStore.activeGroupId || !campaignId.value || !character.value || !isOwner.value) return
  const retired = await characterStore.retireCharacter(groupStore.activeGroupId, campaignId.value, character.value.id)
  confirmingRetirement.value = false
  if (retired) toastStore.show('Character retired.', 'success')
  else toastStore.show(characterStore.error ?? 'Unable to retire the character.', 'error')
}

watch([() => groupStore.activeGroupId, campaignId, characterId], () => void loadCharacter(), { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-5xl">
    <LoadingState v-if="(campaignStore.loading || characterStore.loading) && !character" label="Loading character sheet…" />
    <ErrorState v-else-if="campaignStore.error || characterStore.error && !character" :message="campaignStore.error ?? characterStore.error ?? 'Unable to load the character.'" @retry="loadCharacter" />
    <template v-else-if="campaign && character">
      <PageHeader :eyebrow="`${campaign.system} · ${character.status}`" :title="character.name" :description="`Played by ${playerName}${character.pronouns ? ` · ${character.pronouns}` : ''}`">
        <template #actions><AppButton variant="secondary" @click="router.push(`/campaigns/${campaign.id}`)">Back to campaign</AppButton><AppButton v-if="isOwner" @click="router.push(`/campaigns/${campaign.id}/characters/${character.id}/edit`)">Edit character</AppButton></template>
      </PageHeader>
      <ErrorState v-if="characterStore.error" class="mb-6" :message="characterStore.error" :retryable="false" />
      <div class="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside class="space-y-6">
          <section class="overflow-hidden rounded-2xl border border-white/10 bg-[#181d27]">
            <img v-if="character.portraitUrl" :src="character.portraitUrl" :alt="character.name" class="aspect-square w-full object-cover">
            <div v-else class="grid aspect-square place-items-center bg-gradient-to-br from-[#292047] to-[#1b2630] text-6xl font-bold text-[#c4b5fd]" aria-hidden="true">{{ initials }}</div>
            <div class="p-5"><p class="text-xs uppercase tracking-wider text-slate-400">Status</p><p class="mt-1 font-semibold capitalize text-white">{{ character.status }}</p></div>
          </section>
          <a v-if="character.externalSheetUrl" :href="character.externalSheetUrl" target="_blank" rel="noreferrer" class="flex min-h-11 items-center justify-center rounded-xl border border-[#57d2a4]/30 bg-[#57d2a4]/10 px-4 py-2 text-sm font-bold text-[#57d2a4] hover:bg-[#57d2a4]/15">Open external sheet ↗</a>
        </aside>
        <div class="space-y-6">
          <section class="rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8">
            <h2 class="text-lg font-bold text-white">About {{ character.name }}</h2>
            <p class="mt-3 whitespace-pre-wrap leading-7 text-slate-300">{{ character.publicNotes || 'No campaign-visible notes have been added.' }}</p>
          </section>
          <section v-if="campaign.characterFieldDefinitions.length" class="rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8">
            <h2 class="text-lg font-bold text-white">{{ campaign.system }} details</h2>
            <dl class="mt-5 grid gap-3 sm:grid-cols-2">
              <div v-for="field in campaign.characterFieldDefinitions" :key="field.id" class="rounded-xl border border-white/10 bg-white/[0.03] p-4"><dt class="text-xs font-semibold uppercase tracking-wider text-slate-400">{{ field.label }}</dt><dd class="mt-2 whitespace-pre-wrap font-medium text-white">{{ displayValue(character.fieldValues[field.id]) }}</dd></div>
            </dl>
          </section>
          <section v-if="isOwner && character.status !== 'retired' && campaign.status !== 'archived'" class="rounded-2xl border border-red-500/15 bg-red-500/5 p-6">
            <template v-if="!confirmingRetirement"><h2 class="font-bold text-white">Retire character</h2><p class="mt-2 text-sm text-slate-400">Keep this sheet in the campaign history without deleting it.</p><AppButton class="mt-4" variant="danger" @click="confirmingRetirement = true">Retire character</AppButton></template>
            <template v-else><h2 class="font-bold text-red-100">Retire {{ character.name }}?</h2><div class="mt-4 flex gap-3"><AppButton variant="danger" :loading="characterStore.loading" @click="retireCharacter">Yes, retire</AppButton><AppButton variant="secondary" @click="confirmingRetirement = false">Keep active</AppButton></div></template>
          </section>
        </div>
      </div>
    </template>
    <EmptyState v-else icon="?" title="Character not found" description="This character may not exist or you may not have access to its campaign."><template #actions><AppButton variant="secondary" @click="router.push(campaignId ? `/campaigns/${campaignId}` : '/campaigns')">Back to campaign</AppButton></template></EmptyState>
  </div>
</template>
