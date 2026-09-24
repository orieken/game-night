<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { CampaignCharacterFieldType } from '@/domain/entities/Campaign'
import type { CharacterFieldValue } from '@/domain/entities/Character'
import type { VaultCharacter, VaultCharacterStatus, VaultCharacterVisibility } from '@/domain/entities/VaultCharacter'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { useAuthStore } from '@/stores/authStore'
import { useGroupStore } from '@/stores/groupStore'
import { useToastStore } from '@/stores/toastStore'
import { useVaultCharacterStore } from '@/stores/vaultCharacterStore'

interface FieldDraft { id: string; label: string; type: CampaignCharacterFieldType; required: boolean; options: string; value: CharacterFieldValue }

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const groupStore = useGroupStore()
const toastStore = useToastStore()
const vaultStore = useVaultCharacterStore()
const ready = ref(false)
const validationError = ref<string | null>(null)
const characterId = computed(() => typeof route.params.id === 'string' ? route.params.id : null)
const isEditing = computed(() => Boolean(characterId.value))
const isOwner = computed(() => !isEditing.value || vaultStore.currentCharacter?.ownerId === authStore.user?.id)
const form = reactive({ name: '', system: '', variant: '', pronouns: '', status: 'draft' as VaultCharacterStatus, visibility: 'private' as VaultCharacterVisibility, allowCopying: false, portraitUrl: '', externalSheetUrl: '', publicNotes: '', fields: [] as FieldDraft[] })

async function initialize() {
  ready.value = false
  validationError.value = null
  if (!groupStore.activeGroupId) return
  if (characterId.value) {
    await vaultStore.fetchCharacter(groupStore.activeGroupId, characterId.value)
    if (vaultStore.currentCharacter) populate(vaultStore.currentCharacter)
  } else reset()
  ready.value = true
}

function reset() {
  Object.assign(form, { name: '', system: '', variant: '', pronouns: '', status: 'draft', visibility: 'private', allowCopying: false, portraitUrl: '', externalSheetUrl: '', publicNotes: '', fields: [] })
}

function populate(character: VaultCharacter) {
  Object.assign(form, { name: character.name, system: character.system, variant: character.variant ?? '', pronouns: character.pronouns ?? '', status: character.status, visibility: character.visibility, allowCopying: character.allowCopying, portraitUrl: character.portraitUrl ?? '', externalSheetUrl: character.externalSheetUrl ?? '', publicNotes: character.publicNotes ?? '' })
  form.fields = character.fieldDefinitions.map((field) => ({ ...field, options: field.options.join(', '), value: character.fieldValues[field.id] ?? defaultValue(field.type) }))
}

function defaultValue(type: CampaignCharacterFieldType): CharacterFieldValue {
  if (type === 'boolean') return false
  if (type === 'number') return null
  return ''
}

function addField() { form.fields.push({ id: '', label: '', type: 'text', required: false, options: '', value: '' }) }
function fieldId(label: string, index: number) { return label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `field-${index + 1}` }
function changeFieldType(field: FieldDraft) { field.value = defaultValue(field.type) }

async function submit() {
  validationError.value = null
  const groupId = groupStore.activeGroupId
  const userId = authStore.user?.id
  if (!groupId || !userId || !isOwner.value) return
  if (!form.name.trim() || !form.system.trim()) { validationError.value = 'Character name and game system are required.'; return }
  const fields = form.fields.filter((field) => field.label.trim()).map((field, index) => ({ ...field, id: field.id || fieldId(field.label, index) }))
  const data = {
    name: form.name.trim(), system: form.system.trim(), variant: form.variant.trim() || null, pronouns: form.pronouns.trim() || null,
    status: form.status, visibility: form.visibility, allowCopying: form.visibility === 'table' && form.allowCopying,
    portraitUrl: form.portraitUrl.trim() || null, externalSheetUrl: form.externalSheetUrl.trim() || null, publicNotes: form.publicNotes.trim() || null,
    fieldDefinitions: fields.map((field) => ({ id: field.id, label: field.label.trim(), type: field.type, required: field.required, options: field.type === 'select' ? field.options.split(',').map((option) => option.trim()).filter(Boolean) : [] })),
    fieldValues: Object.fromEntries(fields.map((field) => [field.id, field.type === 'number' && field.value !== null && field.value !== '' ? Number(field.value) : field.value]))
  }
  const saved = isEditing.value && characterId.value
    ? await vaultStore.updateCharacter(groupId, characterId.value, data)
    : await vaultStore.createCharacter(groupId, { ...data, ownerId: userId, source: null, createdById: userId })
  if (!saved) { toastStore.show(vaultStore.error ?? 'Unable to save the character.', 'error'); return }
  toastStore.show(isEditing.value ? 'Vault character updated.' : 'Vault character created.', 'success')
  await router.push(`/characters/${saved.id}`)
}

watch([() => groupStore.activeGroupId, characterId], () => void initialize(), { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <LoadingState v-if="!ready" label="Loading character editor…" />
    <ErrorState v-else-if="vaultStore.error && isEditing && !vaultStore.currentCharacter" :message="vaultStore.error" @retry="initialize" />
    <ErrorState v-else-if="!isOwner" message="Only the owning player can edit this vault character." :retryable="false" />
    <template v-else>
      <PageHeader eyebrow="Character vault" :title="isEditing ? `Edit ${form.name}` : 'Create a character'" description="Build a personal draft or a reusable trial character before choosing a campaign." />
      <form class="space-y-7 rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8" @submit.prevent="submit">
        <div v-if="validationError" class="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200" role="alert">{{ validationError }}</div>
        <section class="space-y-5" aria-labelledby="vault-basics"><h2 id="vault-basics" class="text-lg font-bold text-white">Character basics</h2><div class="grid gap-4 sm:grid-cols-2"><AppInput id="vault-name" v-model="form.name" label="Character name" required /><AppInput id="vault-pronouns" v-model="form.pronouns" label="Pronouns" placeholder="Optional" /></div><div class="grid gap-4 sm:grid-cols-2"><div><label for="vault-system" class="app-label">Game system</label><input id="vault-system" v-model="form.system" class="app-field" list="vault-systems" placeholder="D&D 5e or Symbaroum" required><datalist id="vault-systems"><option value="D&D 5e" /><option value="Symbaroum" /><option value="Ruins of Symbaroum" /><option value="Adventure Time 5e" /><option value="Stranger Things 5e" /></datalist></div><AppInput id="vault-variant" v-model="form.variant" label="Variant or edition" placeholder="Optional" /></div><div class="grid gap-4 sm:grid-cols-2"><div><label for="vault-status" class="app-label">Status</label><select id="vault-status" v-model="form.status" class="app-field"><option value="draft">Draft</option><option value="ready">Ready to play</option><option value="retired">Retired</option></select></div><div><label for="vault-visibility" class="app-label">Visibility</label><select id="vault-visibility" v-model="form.visibility" class="app-field"><option value="private">Private</option><option value="table">Visible to table</option></select></div></div><label v-if="form.visibility === 'table'" class="flex min-h-11 items-start gap-3 rounded-xl border border-white/10 p-4 text-sm text-slate-300"><input v-model="form.allowCopying" type="checkbox" class="mt-0.5 h-5 w-5 rounded border-white/20 bg-[#10131a] text-[#8b5cf6]"><span><strong class="block text-white">Allow other players to copy this character</strong><span class="mt-1 block text-xs text-slate-400">Their copy becomes a private, independent draft in their vault.</span></span></label><div class="grid gap-4 sm:grid-cols-2"><AppInput id="vault-portrait" v-model="form.portraitUrl" type="url" label="Portrait URL" placeholder="Optional" /><AppInput id="vault-sheet" v-model="form.externalSheetUrl" type="url" label="External sheet URL" placeholder="Optional" /></div><div><label for="vault-notes" class="app-label">Table-visible notes</label><textarea id="vault-notes" v-model="form.publicNotes" rows="4" class="app-field" placeholder="Background, personality, or play notes safe to copy."></textarea></div></section>
        <section class="border-t border-white/10 pt-7" aria-labelledby="vault-fields"><div class="flex items-center justify-between gap-4"><div><h2 id="vault-fields" class="text-lg font-bold text-white">Character details</h2><p class="mt-1 text-sm text-slate-400">Add flexible stats such as class, ancestry, level, corruption, or abilities.</p></div><AppButton type="button" variant="secondary" @click="addField">Add field</AppButton></div><div v-if="form.fields.length" class="mt-5 space-y-3"><div v-for="(field, index) in form.fields" :key="index" class="grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-2"><AppInput :id="`vault-field-label-${index}`" v-model="field.label" label="Field label" placeholder="Corruption" /><div><label :for="`vault-field-type-${index}`" class="app-label">Field type</label><select :id="`vault-field-type-${index}`" v-model="field.type" class="app-field" @change="changeFieldType(field)"><option value="text">Short text</option><option value="long_text">Long text</option><option value="number">Number</option><option value="boolean">Yes / no</option><option value="select">Choice list</option></select></div><AppInput v-if="field.type === 'select'" :id="`vault-field-options-${index}`" v-model="field.options" label="Choices" placeholder="Option one, Option two" /><div><label :for="`vault-field-value-${index}`" class="app-label">Value</label><textarea v-if="field.type === 'long_text'" :id="`vault-field-value-${index}`" v-model="field.value as string" rows="3" class="app-field"></textarea><select v-else-if="field.type === 'select'" :id="`vault-field-value-${index}`" v-model="field.value" class="app-field"><option value="">Choose one</option><option v-for="option in field.options.split(',').map((item) => item.trim()).filter(Boolean)" :key="option" :value="option">{{ option }}</option></select><label v-else-if="field.type === 'boolean'" class="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 px-4"><input :id="`vault-field-value-${index}`" v-model="field.value as boolean" type="checkbox" class="h-5 w-5 rounded border-white/20 bg-[#10131a] text-[#8b5cf6]">Yes</label><input v-else :id="`vault-field-value-${index}`" v-model="field.value" :type="field.type === 'number' ? 'number' : 'text'" class="app-field"></div><div class="sm:col-span-2 flex justify-end"><AppButton type="button" variant="ghost" @click="form.fields.splice(index, 1)">Remove field</AppButton></div></div></div></section>
        <div class="flex justify-end gap-3 border-t border-white/10 pt-5"><AppButton type="button" variant="secondary" @click="router.back()">Cancel</AppButton><AppButton type="submit" :loading="vaultStore.loading">{{ isEditing ? 'Save character' : 'Create character' }}</AppButton></div>
      </form>
    </template>
  </div>
</template>
