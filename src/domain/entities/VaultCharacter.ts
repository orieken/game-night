import type { CampaignCharacterFieldDefinition } from '@/domain/entities/Campaign'
import type { CharacterFieldValue } from '@/domain/entities/Character'

export type VaultCharacterStatus = 'draft' | 'ready' | 'retired'
export type VaultCharacterVisibility = 'private' | 'table'

export interface VaultCharacterSource {
  type: 'vault' | 'campaign'
  characterId: string
  characterName: string
  ownerId: string
  campaignId: string | null
}

export interface VaultCharacter {
  id: string
  name: string
  ownerId: string
  system: string
  variant: string | null
  pronouns: string | null
  status: VaultCharacterStatus
  visibility: VaultCharacterVisibility
  allowCopying: boolean
  portraitUrl: string | null
  externalSheetUrl: string | null
  publicNotes: string | null
  fieldDefinitions: CampaignCharacterFieldDefinition[]
  fieldValues: Record<string, CharacterFieldValue>
  source: VaultCharacterSource | null
  createdById: string
  createdAt: Date
  updatedAt: Date
}
