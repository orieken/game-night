export interface AdventureLog {
  id: string
  campaignId: string
  eventId: string
  sessionNumber: number
  title: string
  sessionDate: Date
  attendeeIds: string[]
  characterIds: string[]
  recap: string | null
  progress: string | null
  loot: string | null
  quests: string | null
  memorableMoments: string[]
  nextSessionHooks: string | null
  createdById: string
  createdAt: Date
  updatedAt: Date
}
