<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Campaign, CampaignCharacterFieldType, CampaignKind, CampaignStatus } from '@/domain/entities/Campaign'
import { createHeroQuestCharacterFields } from '@/domain/campaignPresets'
import { useAuthStore } from '@/stores/authStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { useGroupStore } from '@/stores/groupStore'
import { useGameStore } from '@/stores/gameStore'
import { useToastStore } from '@/stores/toastStore'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import PageHeader from '@/components/common/PageHeader.vue'

interface CharacterFieldDraft {
  id: string
  label: string
  type: CampaignCharacterFieldType
  required: boolean
  options: string
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const campaignStore = useCampaignStore()
const groupStore = useGroupStore()
const gameStore = useGameStore()
const toastStore = useToastStore()
const ready = ref(false)
const validationError = ref<string | null>(null)
const campaignId = computed(() => typeof route.params.id === 'string' ? route.params.id : null)
const isEditing = computed(() => Boolean(campaignId.value))
const memberRole = computed(() => groupStore.members.find((member) => member.userId === authStore.user?.id)?.role)
const isOrganizer = computed(() => memberRole.value === 'owner' || memberRole.value === 'organizer')
const canManage = computed(() => isOrganizer.value || Boolean(
  isEditing.value && campaignStore.currentCampaign?.dmIds.includes(authStore.user?.id ?? '')
))

const form = reactive({
  kind: 'tabletop_rpg' as CampaignKind,
  gameId: '',
  name: '',
  description: '',
  system: '',
  variant: '',
  status: 'active' as CampaignStatus,
  dmIds: [] as string[],
  memberIds: [] as string[],
  externalLinks: [] as Array<{ label: string; url: string }>,
  characterFields: [] as CharacterFieldDraft[]
})

async function initialize() {
  ready.value = false
  validationError.value = null
  const groupId = groupStore.activeGroupId
  if (!groupId) return
  await Promise.all([groupStore.fetchMembers(groupId), gameStore.fetchGames(groupId)])
  if (campaignId.value) {
    await campaignStore.fetchCampaignById(groupId, campaignId.value)
    if (campaignStore.currentCampaign) populateForm(campaignStore.currentCampaign)
  } else {
    resetForm()
  }
  ready.value = true
}

function resetForm() {
  const userId = authStore.user?.id
  form.kind = 'tabletop_rpg'
  form.gameId = ''
  form.name = ''
  form.description = ''
  form.system = ''
  form.variant = ''
  form.status = 'active'
  form.dmIds = userId ? [userId] : []
  form.memberIds = userId ? [userId] : []
  form.externalLinks = []
  form.characterFields = []
}

function populateForm(campaign: Campaign) {
  form.kind = campaign.kind
  form.gameId = campaign.gameId ?? ''
  form.name = campaign.name
  form.description = campaign.description ?? ''
  form.system = campaign.system
  form.variant = campaign.variant ?? ''
  form.status = campaign.status
  form.dmIds = [...campaign.dmIds]
  form.memberIds = [...campaign.memberIds]
  form.externalLinks = campaign.externalLinks.map((link) => ({ ...link }))
  form.characterFields = campaign.characterFieldDefinitions.map((field) => ({
    ...field,
    options: field.options.join(', ')
  }))
}

function addExternalLink() {
  form.externalLinks.push({ label: '', url: '' })
}

function addCharacterField() {
  form.characterFields.push({ id: '', label: '', type: 'text', required: false, options: '' })
}

function applyHeroQuestPreset() {
  form.kind = 'campaign_board_game'
  form.system = 'HeroQuest'
  form.gameId = gameStore.games.find((game) => game.name.trim().toLowerCase() === 'heroquest')?.id ?? form.gameId
  form.characterFields = createHeroQuestCharacterFields().map((field) => ({ ...field, options: field.options.join(', ') }))
}

function fieldId(label: string, index: number) {
  return label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `field-${index + 1}`
}

async function submit() {
  validationError.value = null
  const groupId = groupStore.activeGroupId
  const userId = authStore.user?.id
  if (!groupId || !userId || !canManage.value) return
  if (!form.name.trim() || !form.system.trim()) {
    validationError.value = 'Campaign name and game system are required.'
    return
  }
  if (!form.dmIds.length) {
    validationError.value = 'Choose at least one DM.'
    return
  }

  const dmIds = [...new Set(form.dmIds)]
  const memberIds = [...new Set([...form.memberIds, ...dmIds])]
  const data = {
    kind: form.kind,
    gameId: form.kind === 'campaign_board_game' ? form.gameId || null : null,
    name: form.name.trim(),
    description: form.description.trim() || null,
    system: form.system.trim(),
    variant: form.variant.trim() || null,
    status: form.status,
    dmIds,
    memberIds,
    externalLinks: form.externalLinks
      .filter((link) => link.label.trim() && link.url.trim())
      .map((link) => ({ label: link.label.trim(), url: link.url.trim() })),
    characterFieldDefinitions: form.characterFields
      .filter((field) => field.label.trim())
      .map((field, index) => ({
        id: field.id || fieldId(field.label, index),
        label: field.label.trim(),
        type: field.type,
        required: field.required,
        options: field.type === 'select' ? field.options.split(',').map((option) => option.trim()).filter(Boolean) : []
      }))
  }

  const saved = isEditing.value && campaignId.value
    ? await campaignStore.updateCampaign(groupId, campaignId.value, data)
    : await campaignStore.createCampaign(groupId, { ...data, createdById: userId })

  if (!saved) {
    toastStore.show(campaignStore.error ?? 'Unable to save the campaign.', 'error')
    return
  }
  toastStore.show(isEditing.value ? 'Campaign updated.' : 'Campaign created.', 'success')
  await router.push(`/campaigns/${saved.id}`)
}

watch([() => groupStore.activeGroupId, campaignId], () => void initialize(), { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <LoadingState v-if="!ready || campaignStore.loading && isEditing" label="Loading campaign editor…" />
    <ErrorState v-else-if="campaignStore.error && isEditing && !campaignStore.currentCampaign" :message="campaignStore.error" @retry="initialize" />
    <ErrorState v-else-if="!canManage" :message="isEditing ? 'Only table organizers and assigned DMs can edit this campaign.' : 'Only table owners and organizers can create campaigns.'" :retryable="false" />

    <template v-else>
      <PageHeader :title="isEditing ? 'Edit campaign' : 'Create campaign'" :description="isEditing ? 'Update the campaign setup, players, and character fields.' : 'Create a flexible home for your tabletop adventure.'" />
      <form class="space-y-7 rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8" @submit.prevent="submit">
        <div v-if="validationError" class="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200" role="alert">{{ validationError }}</div>
        <section class="space-y-5" aria-labelledby="campaign-basics-heading">
          <h2 id="campaign-basics-heading" class="text-lg font-bold text-white">Campaign basics</h2>
          <fieldset>
            <legend class="app-label">Campaign type</legend>
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="cursor-pointer rounded-xl border p-4 transition" :class="form.kind === 'tabletop_rpg' ? 'border-[#57d2a4]/70 bg-[#57d2a4]/10' : 'border-white/10 bg-white/[0.02]'">
                <input v-model="form.kind" class="sr-only" type="radio" name="campaign-kind" value="tabletop_rpg">
                <strong class="block text-white">Tabletop RPG</strong><span class="mt-1 block text-xs text-slate-400">D&amp;D, Symbaroum, and other roleplaying systems.</span>
              </label>
              <label class="cursor-pointer rounded-xl border p-4 transition" :class="form.kind === 'campaign_board_game' ? 'border-[#57d2a4]/70 bg-[#57d2a4]/10' : 'border-white/10 bg-white/[0.02]'">
                <input v-model="form.kind" class="sr-only" type="radio" name="campaign-kind" value="campaign_board_game">
                <strong class="block text-white">Campaign board game</strong><span class="mt-1 block text-xs text-slate-400">HeroQuest and other games with heroes that progress.</span>
              </label>
            </div>
          </fieldset>
          <div v-if="form.kind === 'campaign_board_game'" class="rounded-xl border border-[#8b5cf6]/25 bg-[#8b5cf6]/10 p-4">
            <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p class="font-semibold text-white">Starting a HeroQuest campaign?</p><p class="mt-1 text-xs leading-5 text-slate-300">Load fields for Body Points, Mind Points, gold, gear, spells, and completed quests.</p></div><AppButton type="button" variant="secondary" @click="applyHeroQuestPreset">Use HeroQuest preset</AppButton></div>
          </div>
          <AppInput id="campaign-name" v-model="form.name" label="Campaign name" placeholder="The Darkest Star" required />
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="campaign-system" class="app-label">Game system</label>
              <input id="campaign-system" v-model="form.system" list="campaign-system-options" class="app-field" placeholder="D&D 5e, Symbaroum, or HeroQuest" required>
              <datalist id="campaign-system-options"><option value="D&D 5e" /><option value="Symbaroum" /><option value="Ruins of Symbaroum" /><option value="Adventure Time 5e" /><option value="Stranger Things 5e" /><option value="HeroQuest" /></datalist>
            </div>
            <AppInput id="campaign-variant" v-model="form.variant" label="Variant or edition" placeholder="Optional house rules or edition" />
          </div>
          <div v-if="form.kind === 'campaign_board_game'">
            <label for="campaign-game" class="app-label">Linked library game</label>
            <select id="campaign-game" v-model="form.gameId" class="app-field"><option value="">No linked game</option><option v-for="game in gameStore.games" :key="game.id" :value="game.id">{{ game.name }}</option></select>
            <p class="mt-2 text-xs text-slate-400">Link the campaign to a game already in your table library.</p>
          </div>
          <div>
            <label for="campaign-description" class="app-label">Description</label>
            <textarea id="campaign-description" v-model="form.description" rows="4" class="app-field" placeholder="Set the scene for your players."></textarea>
          </div>
          <div v-if="isEditing">
            <label for="campaign-status" class="app-label">Status</label>
            <select id="campaign-status" v-model="form.status" class="app-field"><option value="active">Active</option><option value="on_hold">On hold</option><option value="completed">Completed</option><option value="archived">Archived</option></select>
          </div>
        </section>

        <section class="border-t border-white/10 pt-7" aria-labelledby="campaign-people-heading">
          <h2 id="campaign-people-heading" class="text-lg font-bold text-white">{{ form.kind === 'campaign_board_game' ? 'Managers and players' : 'DMs and players' }}</h2>
          <p class="mt-1 text-sm text-slate-400">{{ form.kind === 'campaign_board_game' ? 'Campaign managers can maintain the campaign and its table-owned heroes.' : 'DMs can edit and archive this campaign. Every DM is also included as a campaign member.' }}</p>
          <div class="mt-5 grid gap-6 sm:grid-cols-2">
            <fieldset>
              <legend class="app-label">{{ form.kind === 'campaign_board_game' ? 'Campaign managers' : 'Dungeon masters' }}</legend>
              <div class="space-y-2">
                <label v-for="member in groupStore.members" :key="`dm-${member.userId}`" class="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200"><input v-model="form.dmIds" type="checkbox" :value="member.userId" class="h-5 w-5 rounded border-white/20 bg-[#10131a] text-[#8b5cf6]"><span>{{ member.displayName }}</span></label>
              </div>
            </fieldset>
            <fieldset>
              <legend class="app-label">Campaign players</legend>
              <div class="space-y-2">
                <label v-for="member in groupStore.members" :key="`player-${member.userId}`" class="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200"><input v-model="form.memberIds" type="checkbox" :value="member.userId" class="h-5 w-5 rounded border-white/20 bg-[#10131a] text-[#8b5cf6]"><span>{{ member.displayName }}</span></label>
              </div>
            </fieldset>
          </div>
        </section>

        <section class="border-t border-white/10 pt-7" aria-labelledby="campaign-links-heading">
          <div class="flex items-center justify-between gap-4"><div><h2 id="campaign-links-heading" class="text-lg font-bold text-white">External links</h2><p class="mt-1 text-sm text-slate-400">Optional links to a virtual tabletop, shared notes, or rule references.</p></div><AppButton type="button" variant="secondary" @click="addExternalLink">Add link</AppButton></div>
          <div v-if="form.externalLinks.length" class="mt-5 space-y-3">
            <div v-for="(link, index) in form.externalLinks" :key="index" class="grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
              <AppInput :id="`link-label-${index}`" v-model="link.label" label="Label" placeholder="Campaign notes" />
              <AppInput :id="`link-url-${index}`" v-model="link.url" type="url" label="URL" placeholder="https://…" />
              <AppButton type="button" variant="ghost" @click="form.externalLinks.splice(index, 1)">Remove</AppButton>
            </div>
          </div>
        </section>

        <section class="border-t border-white/10 pt-7" aria-labelledby="character-fields-heading">
          <div class="flex items-center justify-between gap-4"><div><h2 id="character-fields-heading" class="text-lg font-bold text-white">Character fields</h2><p class="mt-1 text-sm text-slate-400">Optional campaign-specific details such as class, ancestry, corruption, or level.</p></div><AppButton type="button" variant="secondary" @click="addCharacterField">Add field</AppButton></div>
          <div v-if="form.characterFields.length" class="mt-5 space-y-3">
            <div v-for="(field, index) in form.characterFields" :key="index" class="grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-2">
              <AppInput :id="`field-label-${index}`" v-model="field.label" label="Field label" placeholder="Corruption" />
              <div><label :for="`field-type-${index}`" class="app-label">Field type</label><select :id="`field-type-${index}`" v-model="field.type" class="app-field"><option value="text">Short text</option><option value="long_text">Long text</option><option value="number">Number</option><option value="boolean">Yes / no</option><option value="select">Choice list</option></select></div>
              <AppInput v-if="field.type === 'select'" :id="`field-options-${index}`" v-model="field.options" label="Choices" placeholder="Option one, Option two" />
              <div class="flex items-end justify-between gap-3"><label class="flex min-h-11 items-center gap-3 text-sm text-slate-300"><input v-model="field.required" type="checkbox" class="h-5 w-5 rounded border-white/20 bg-[#10131a] text-[#8b5cf6]">Required</label><AppButton type="button" variant="ghost" @click="form.characterFields.splice(index, 1)">Remove</AppButton></div>
            </div>
          </div>
        </section>

        <div class="flex justify-end gap-3 border-t border-white/10 pt-5">
          <AppButton type="button" variant="secondary" @click="router.back()">Cancel</AppButton>
          <AppButton type="submit" :loading="campaignStore.loading">{{ isEditing ? 'Save changes' : 'Create campaign' }}</AppButton>
        </div>
      </form>
    </template>
  </div>
</template>
