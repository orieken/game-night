export type CharacterStatus = 'active' | 'inactive' | 'retired' | 'deceased'

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
  createdById: string
  createdAt: Date
  updatedAt: Date
}
