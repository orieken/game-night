<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { CampaignCharacterFieldDefinition } from '@/domain/entities/Campaign'
import type { Character, CharacterFieldValue, CharacterOwnership, CharacterStatus } from '@/domain/entities/Character'
import { useAuthStore } from '@/stores/authStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useGroupStore } from '@/stores/groupStore'
import { useToastStore } from '@/stores/toastStore'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
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
const ready = ref(false)
const validationError = ref<string | null>(null)
const campaignId = computed(() => typeof route.params.campaignId === 'string' ? route.params.campaignId : null)
const characterId = computed(() => typeof route.params.characterId === 'string' ? route.params.characterId : null)
const isEditing = computed(() => Boolean(characterId.value))
const campaign = computed(() => campaignStore.currentCampaign)
const campaignMembers = computed(() => groupStore.members.filter((member) => campaign.value?.memberIds.includes(member.userId)))
const memberRole = computed(() => groupStore.members.find((member) => member.userId === authStore.user?.id)?.role)
const isManager = computed(() => memberRole.value === 'owner' || memberRole.value === 'organizer' || Boolean(campaign.value?.dmIds.includes(authStore.user?.id ?? '')))
const isParticipant = computed(() => Boolean(authStore.user && campaign.value && (
  campaign.value.memberIds.includes(authStore.user.id) || campaign.value.dmIds.includes(authStore.user.id)
)))
const canEdit = computed(() => {
  if (!isEditing.value) return isParticipant.value && campaign.value?.status !== 'archived'
  const character = characterStore.currentCharacter
  if (!character || campaign.value?.status === 'archived') return false
  return character.ownershipType === 'table'
    ? isManager.value || character.controllerId === authStore.user?.id
    : character.playerId === authStore.user?.id
})
const canEditIdentity = computed(() => form.ownershipType !== 'table' || isManager.value)

const form = reactive({
  ownershipType: 'player' as CharacterOwnership,
  controllerId: '',
  name: '',
  pronouns: '',
  status: 'active' as CharacterStatus,
  portraitUrl: '',
  externalSheetUrl: '',
  publicNotes: '',
  allowCopying: false,
  fieldValues: {} as Record<string, CharacterFieldValue>
})

async function initialize() {
  ready.value = false
  validationError.value = null
  const groupId = groupStore.activeGroupId
  if (!groupId || !campaignId.value) return
  await Promise.all([
    campaignStore.fetchCampaignById(groupId, campaignId.value),
    groupStore.fetchMembers(groupId)
  ])
  if (characterId.value) {
    await characterStore.fetchCharacterById(groupId, campaignId.value, characterId.value)
    if (characterStore.currentCharacter) populateForm(characterStore.currentCharacter)
  } else {
    resetForm()
  }
  ready.value = true
}

function defaultValue(field: CampaignCharacterFieldDefinition): CharacterFieldValue {
  if (field.type === 'boolean') return false
  if (field.type === 'number') return null
  return ''
}

function resetForm() {
  form.ownershipType = campaign.value?.kind === 'campaign_board_game' && isManager.value ? 'table' : 'player'
  form.controllerId = form.ownershipType === 'table' ? '' : authStore.user?.id ?? ''
  form.name = ''
  form.pronouns = ''
  form.status = 'active'
  form.portraitUrl = ''
  form.externalSheetUrl = ''
  form.publicNotes = ''
  form.allowCopying = false
  form.fieldValues = Object.fromEntries((campaign.value?.characterFieldDefinitions ?? []).map((field) => [field.id, defaultValue(field)]))
}

function populateForm(character: Character) {
  form.ownershipType = character.ownershipType
  form.controllerId = character.controllerId ?? ''
  form.name = character.name
  form.pronouns = character.pronouns ?? ''
  form.status = character.status
  form.portraitUrl = character.portraitUrl ?? ''
  form.externalSheetUrl = character.externalSheetUrl ?? ''
  form.publicNotes = character.publicNotes ?? ''
  form.allowCopying = character.allowCopying
  form.fieldValues = Object.fromEntries((campaign.value?.characterFieldDefinitions ?? []).map((field) => [
    field.id,
    character.fieldValues[field.id] ?? defaultValue(field)
  ]))
}

function missingRequiredField(field: CampaignCharacterFieldDefinition) {
  if (!field.required) return false
  const value = form.fieldValues[field.id]
  if (field.type === 'boolean') return typeof value !== 'boolean'
  if (field.type === 'number') return value === null || value === '' || !Number.isFinite(Number(value))
  return typeof value !== 'string' || !value.trim()
}

function normalizedFieldValues() {
  return Object.fromEntries((campaign.value?.characterFieldDefinitions ?? []).map((field) => {
    const value = form.fieldValues[field.id]
    if (field.type === 'boolean') return [field.id, Boolean(value)]
    if (field.type === 'number') return [field.id, value === '' || value === null ? null : Number(value)]
    return [field.id, typeof value === 'string' ? value.trim() || null : null]
  }))
}

async function submit() {
  validationError.value = null
  const groupId = groupStore.activeGroupId
  const userId = authStore.user?.id
  if (!groupId || !campaignId.value || !userId || !canEdit.value) return
  if (!form.name.trim()) {
    validationError.value = 'Character name is required.'
    return
  }
  const missingField = campaign.value?.characterFieldDefinitions.find(missingRequiredField)
  if (missingField) {
    validationError.value = `${missingField.label} is required.`
    return
  }

  const data = {
    name: form.name.trim(),
    pronouns: form.pronouns.trim() || null,
    status: form.status,
    portraitUrl: form.portraitUrl.trim() || null,
    externalSheetUrl: form.externalSheetUrl.trim() || null,
    publicNotes: form.publicNotes.trim() || null,
    allowCopying: form.allowCopying,
    fieldValues: normalizedFieldValues(),
    controllerId: form.ownershipType === 'table' ? form.controllerId || null : userId
  }
  const saved = isEditing.value && characterId.value
    ? await characterStore.updateCharacter(groupId, campaignId.value, characterId.value, data)
    : await characterStore.createCharacter(groupId, campaignId.value, {
      ...data,
      ownershipType: form.ownershipType,
      playerId: form.ownershipType === 'table' ? null : userId,
      createdById: userId
    })

  if (!saved) {
    toastStore.show(characterStore.error ?? 'Unable to save the character.', 'error')
    return
  }
  toastStore.show(isEditing.value ? 'Character updated.' : 'Character created.', 'success')
  await router.push(`/campaigns/${campaignId.value}/characters/${saved.id}`)
}

watch([() => groupStore.activeGroupId, campaignId, characterId], () => void initialize(), { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <LoadingState v-if="!ready" label="Loading character sheet…" />
    <ErrorState v-else-if="campaignStore.error || characterStore.error && isEditing && !characterStore.currentCharacter" :message="campaignStore.error ?? characterStore.error ?? 'Unable to load the character sheet.'" @retry="initialize" />
    <ErrorState v-else-if="!canEdit" :message="isEditing ? 'Only the owning player, assigned controller, or a campaign manager can edit this character.' : 'Only active campaign members can create characters.'" :retryable="false" />
    <template v-else-if="campaign">
      <PageHeader :eyebrow="campaign.system" :title="isEditing ? `Edit ${form.name || 'character'}` : 'Create character'" :description="`Character sheet for ${campaign.name}.`" />
      <form class="space-y-7 rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8" @submit.prevent="submit">
        <div v-if="validationError" class="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200" role="alert">{{ validationError }}</div>
        <section class="space-y-5" aria-labelledby="identity-heading">
          <h2 id="identity-heading" class="text-lg font-bold text-white">Identity</h2>
          <fieldset v-if="campaign.kind === 'campaign_board_game' && (!isEditing || form.ownershipType === 'table')" class="space-y-3">
            <legend class="app-label">Character ownership</legend>
            <div v-if="!isEditing && isManager" class="grid gap-3 sm:grid-cols-2">
              <label class="cursor-pointer rounded-xl border p-4" :class="form.ownershipType === 'table' ? 'border-[#57d2a4]/70 bg-[#57d2a4]/10' : 'border-white/10'"><input v-model="form.ownershipType" type="radio" value="table" class="sr-only" @change="form.controllerId = ''"><strong class="block text-white">Table-owned hero</strong><span class="mt-1 block text-xs text-slate-400">Any assigned player can control this hero.</span></label>
              <label class="cursor-pointer rounded-xl border p-4" :class="form.ownershipType === 'player' ? 'border-[#57d2a4]/70 bg-[#57d2a4]/10' : 'border-white/10'"><input v-model="form.ownershipType" type="radio" value="player" class="sr-only" @change="form.controllerId = authStore.user?.id ?? ''"><strong class="block text-white">My character</strong><span class="mt-1 block text-xs text-slate-400">This character remains managed by you.</span></label>
            </div>
            <p v-else-if="form.ownershipType === 'table'" class="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">This is a table-owned hero. Its controller may change between sessions.</p>
            <div v-if="form.ownershipType === 'table'">
              <label for="character-controller" class="app-label">Current controller</label>
              <select id="character-controller" v-model="form.controllerId" class="app-field" :disabled="!isManager"><option value="">Unassigned</option><option v-for="member in campaignMembers" :key="member.userId" :value="member.userId">{{ member.displayName }}</option></select>
              <p class="mt-2 text-xs text-slate-400">The controller can update this hero’s progression; campaign managers can reassign it.</p>
            </div>
          </fieldset>
          <p v-if="form.ownershipType === 'table' && !isManager" class="rounded-xl border border-[#57d2a4]/20 bg-[#57d2a4]/10 p-4 text-sm text-slate-300">As this hero’s controller, you can update progression fields and campaign-visible notes. A campaign manager controls identity, assignment, retirement, and sharing.</p>
          <div class="grid gap-4 sm:grid-cols-2"><AppInput id="character-name" v-model="form.name" label="Character name" required :disabled="!canEditIdentity" /><AppInput id="character-pronouns" v-model="form.pronouns" label="Pronouns" placeholder="Optional" :disabled="!canEditIdentity" /></div>
          <div v-if="isEditing"><label for="character-status" class="app-label">Status</label><select id="character-status" v-model="form.status" class="app-field" :disabled="!canEditIdentity"><option value="active">Active</option><option value="inactive">Inactive</option><option value="retired">Retired</option><option value="deceased">Deceased</option></select></div>
          <div class="grid gap-4 sm:grid-cols-2"><AppInput id="portrait-url" v-model="form.portraitUrl" type="url" label="Portrait URL" placeholder="Optional" :disabled="!canEditIdentity" /><AppInput id="sheet-url" v-model="form.externalSheetUrl" type="url" label="External sheet URL" placeholder="Optional" :disabled="!canEditIdentity" /></div>
          <div><label for="public-notes" class="app-label">Campaign-visible notes</label><textarea id="public-notes" v-model="form.publicNotes" rows="4" class="app-field" placeholder="Background, personality, or details the party knows."></textarea></div>
          <label class="flex min-h-11 items-start gap-3 rounded-xl border border-white/10 p-4 text-sm text-slate-300"><input v-model="form.allowCopying" type="checkbox" :disabled="!canEditIdentity" class="mt-0.5 h-5 w-5 rounded border-white/20 bg-[#10131a] text-[#8b5cf6]"><span><strong class="block text-white">Allow campaign members to copy this character</strong><span class="mt-1 block text-xs text-slate-400">Copies exclude campaign history and become privately owned vault drafts.</span></span></label>
        </section>

        <section v-if="campaign.characterFieldDefinitions.length" class="border-t border-white/10 pt-7" aria-labelledby="campaign-fields-heading">
          <h2 id="campaign-fields-heading" class="text-lg font-bold text-white">{{ campaign.system }} details</h2>
          <p class="mt-1 text-sm text-slate-400">Fields chosen by this campaign’s {{ campaign.kind === 'campaign_board_game' ? 'managers' : 'DMs' }}.</p>
          <div class="mt-5 grid gap-5 sm:grid-cols-2">
            <div v-for="field in campaign.characterFieldDefinitions" :key="field.id" :class="field.type === 'long_text' ? 'sm:col-span-2' : ''">
              <label :for="`custom-${field.id}`" class="app-label">{{ field.label }}<span v-if="field.required" class="text-[#ff6b5e]"> *</span></label>
              <textarea v-if="field.type === 'long_text'" :id="`custom-${field.id}`" v-model="form.fieldValues[field.id] as string" rows="3" class="app-field" :required="field.required"></textarea>
              <select v-else-if="field.type === 'select'" :id="`custom-${field.id}`" v-model="form.fieldValues[field.id]" class="app-field" :required="field.required"><option value="">Choose one</option><option v-for="option in field.options" :key="option" :value="option">{{ option }}</option></select>
              <label v-else-if="field.type === 'boolean'" class="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300"><input :id="`custom-${field.id}`" v-model="form.fieldValues[field.id] as boolean" type="checkbox" class="h-5 w-5 rounded border-white/20 bg-[#10131a] text-[#8b5cf6]">Yes</label>
              <input v-else :id="`custom-${field.id}`" v-model="form.fieldValues[field.id]" :type="field.type === 'number' ? 'number' : 'text'" class="app-field" :required="field.required">
            </div>
          </div>
        </section>

        <div class="flex justify-end gap-3 border-t border-white/10 pt-5"><AppButton type="button" variant="secondary" @click="router.back()">Cancel</AppButton><AppButton type="submit" :loading="characterStore.loading">{{ isEditing ? 'Save character' : 'Create character' }}</AppButton></div>
      </form>
    </template>
  </div>
</template>
