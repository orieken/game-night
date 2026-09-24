import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Campaign } from '@/domain/entities/Campaign'
import type { Character } from '@/domain/entities/Character'
import type { VaultCharacter } from '@/domain/entities/VaultCharacter'
import { characterRepository } from '@/infrastructure/repositories/characterRepository'
import { vaultCharacterRepository } from '@/infrastructure/repositories/vaultCharacterRepository'

export interface ProfileCampaignCharacter {
  character: Character
  campaign: Campaign
}

export const useVaultCharacterStore = defineStore('vaultCharacter', () => {
  const ownedCharacters = ref<VaultCharacter[]>([])
  const sharedCharacters = ref<VaultCharacter[]>([])
  const profileCampaignCharacters = ref<ProfileCampaignCharacter[]>([])
  const currentCharacter = ref<VaultCharacter | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchVault(groupId: string, userId: string) {
    loading.value = true
    error.value = null
    try {
      const [owned, visible] = await Promise.all([
        vaultCharacterRepository.getOwned(groupId, userId),
        vaultCharacterRepository.getTableVisible(groupId)
      ])
      ownedCharacters.value = owned
      sharedCharacters.value = visible.filter((character) => character.ownerId !== userId)
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to load the character vault.'
    } finally {
      loading.value = false
    }
  }

  async function fetchCharacter(groupId: string, id: string) {
    loading.value = true
    error.value = null
    currentCharacter.value = null
    try {
      currentCharacter.value = await vaultCharacterRepository.getById(groupId, id)
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to load this vault character.'
    } finally {
      loading.value = false
    }
  }

  async function createCharacter(groupId: string, character: Omit<VaultCharacter, 'id' | 'createdAt' | 'updatedAt'>) {
    loading.value = true
    error.value = null
    try {
      const created = await vaultCharacterRepository.create(groupId, character)
      ownedCharacters.value.push(created)
      return created
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to create the vault character.'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateCharacter(groupId: string, id: string, updates: Partial<VaultCharacter>) {
    loading.value = true
    error.value = null
    try {
      const updated = await vaultCharacterRepository.update(groupId, id, updates)
      const index = ownedCharacters.value.findIndex((character) => character.id === id)
      if (index !== -1) ownedCharacters.value[index] = updated
      currentCharacter.value = updated
      return updated
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to update the vault character.'
      return null
    } finally {
      loading.value = false
    }
  }

  async function copyToVault(groupId: string, source: VaultCharacter, userId: string) {
    return createCharacter(groupId, {
      name: `${source.name} copy`,
      ownerId: userId,
      system: source.system,
      variant: source.variant,
      pronouns: source.pronouns,
      status: 'draft',
      visibility: 'private',
      allowCopying: false,
      portraitUrl: source.portraitUrl,
      externalSheetUrl: source.externalSheetUrl,
      publicNotes: source.publicNotes,
      fieldDefinitions: source.fieldDefinitions.map((field) => ({ ...field, options: [...field.options] })),
      fieldValues: { ...source.fieldValues },
      source: { type: 'vault', characterId: source.id, characterName: source.name, ownerId: source.ownerId, campaignId: null },
      createdById: userId
    })
  }

  async function copyCampaignCharacter(groupId: string, source: Character, campaign: Campaign, userId: string) {
    return createCharacter(groupId, {
      name: `${source.name} copy`,
      ownerId: userId,
      system: campaign.system,
      variant: campaign.variant,
      pronouns: source.pronouns,
      status: 'draft',
      visibility: 'private',
      allowCopying: false,
      portraitUrl: source.portraitUrl,
      externalSheetUrl: source.externalSheetUrl,
      publicNotes: source.publicNotes,
      fieldDefinitions: campaign.characterFieldDefinitions.map((field) => ({ ...field, options: [...field.options] })),
      fieldValues: { ...source.fieldValues },
      source: { type: 'campaign', characterId: source.id, characterName: source.name, ownerId: source.playerId, campaignId: campaign.id },
      createdById: userId
    })
  }

  async function fetchProfileCampaignCharacters(groupId: string, campaigns: Campaign[], targetUserId: string, viewerUserId: string, viewerIsOrganizer: boolean) {
    loading.value = true
    error.value = null
    try {
      const accessible = campaigns.filter((campaign) => viewerIsOrganizer || campaign.memberIds.includes(viewerUserId) || campaign.dmIds.includes(viewerUserId))
      const results = await Promise.all(accessible.map(async (campaign) => ({ campaign, characters: await characterRepository.getAll(groupId, campaign.id) })))
      profileCampaignCharacters.value = results.flatMap(({ campaign, characters }) => characters
        .filter((character) => character.playerId === targetUserId)
        .map((character) => ({ campaign, character })))
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to load campaign characters.'
    } finally {
      loading.value = false
    }
  }

  return { ownedCharacters, sharedCharacters, profileCampaignCharacters, currentCharacter, loading, error, fetchVault, fetchCharacter, createCharacter, updateCharacter, copyToVault, copyCampaignCharacter, fetchProfileCampaignCharacters }
})
