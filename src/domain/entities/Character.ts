export type CharacterStatus = 'active' | 'inactive' | 'retired' | 'deceased'
export type CharacterOwnership = 'player' | 'table'
export type CharacterFieldValue = string | number | boolean | null

export interface Character {
  id: string
  campaignId: string
  name: string
  ownershipType: CharacterOwnership
  playerId: string | null
  controllerId: string | null
  pronouns: string | null
  status: CharacterStatus
  portraitUrl: string | null
  externalSheetUrl: string | null
  publicNotes: string | null
  allowCopying: boolean
  fieldValues: Record<string, CharacterFieldValue>
  createdById: string
  createdAt: Date
  updatedAt: Date
}
