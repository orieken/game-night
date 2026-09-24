export type CharacterStatus = 'active' | 'inactive' | 'retired' | 'deceased'
export type CharacterFieldValue = string | number | boolean | null

export interface Character {
  id: string
  campaignId: string
  name: string
  playerId: string
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
