<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { CampaignCharacterFieldDefinition } from '@/domain/entities/Campaign'
import type { Character, CharacterFieldValue, CharacterStatus } from '@/domain/entities/Character'
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
const isParticipant = computed(() => Boolean(authStore.user && campaign.value && (
  campaign.value.memberIds.includes(authStore.user.id) || campaign.value.dmIds.includes(authStore.user.id)
)))
const canEdit = computed(() => isEditing.value
  ? characterStore.currentCharacter?.playerId === authStore.user?.id
  : isParticipant.value && campaign.value?.status !== 'archived')

const form = reactive({
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
    fieldValues: normalizedFieldValues()
  }
  const saved = isEditing.value && characterId.value
    ? await characterStore.updateCharacter(groupId, campaignId.value, characterId.value, data)
    : await characterStore.createCharacter(groupId, campaignId.value, { ...data, playerId: userId, createdById: userId })

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
    <ErrorState v-else-if="!canEdit" :message="isEditing ? 'Only the owning player can edit this character.' : 'Only active campaign members can create characters.'" :retryable="false" />
    <template v-else-if="campaign">
      <PageHeader :eyebrow="campaign.system" :title="isEditing ? `Edit ${form.name || 'character'}` : 'Create character'" :description="`Character sheet for ${campaign.name}.`" />
      <form class="space-y-7 rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8" @submit.prevent="submit">
        <div v-if="validationError" class="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200" role="alert">{{ validationError }}</div>
        <section class="space-y-5" aria-labelledby="identity-heading">
          <h2 id="identity-heading" class="text-lg font-bold text-white">Identity</h2>
          <div class="grid gap-4 sm:grid-cols-2"><AppInput id="character-name" v-model="form.name" label="Character name" required /><AppInput id="character-pronouns" v-model="form.pronouns" label="Pronouns" placeholder="Optional" /></div>
          <div v-if="isEditing"><label for="character-status" class="app-label">Status</label><select id="character-status" v-model="form.status" class="app-field"><option value="active">Active</option><option value="inactive">Inactive</option><option value="retired">Retired</option><option value="deceased">Deceased</option></select></div>
          <div class="grid gap-4 sm:grid-cols-2"><AppInput id="portrait-url" v-model="form.portraitUrl" type="url" label="Portrait URL" placeholder="Optional" /><AppInput id="sheet-url" v-model="form.externalSheetUrl" type="url" label="External sheet URL" placeholder="Optional" /></div>
          <div><label for="public-notes" class="app-label">Campaign-visible notes</label><textarea id="public-notes" v-model="form.publicNotes" rows="4" class="app-field" placeholder="Background, personality, or details the party knows."></textarea></div>
          <label class="flex min-h-11 items-start gap-3 rounded-xl border border-white/10 p-4 text-sm text-slate-300"><input v-model="form.allowCopying" type="checkbox" class="mt-0.5 h-5 w-5 rounded border-white/20 bg-[#10131a] text-[#8b5cf6]"><span><strong class="block text-white">Allow campaign members to copy this character</strong><span class="mt-1 block text-xs text-slate-400">Copies exclude campaign history and become privately owned vault drafts.</span></span></label>
        </section>

        <section v-if="campaign.characterFieldDefinitions.length" class="border-t border-white/10 pt-7" aria-labelledby="campaign-fields-heading">
          <h2 id="campaign-fields-heading" class="text-lg font-bold text-white">{{ campaign.system }} details</h2>
          <p class="mt-1 text-sm text-slate-400">Fields chosen by this campaign’s DMs.</p>
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
