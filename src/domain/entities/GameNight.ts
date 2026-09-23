export type GameNightType = 'board_game' | 'tabletop_rpg' | 'mixed'

export interface GameNight {
  id: string
  name: string
  description: string | null
  eventDate: Date
  location: string | null
  hostId: string
  eventType: GameNightType
  campaignId: string | null
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled'
  maxAttendees: number | null
  isPublic: boolean
  invitedUserIds: string[]
  selectedGameIds: string[]
  attendeeCount: number
  rsvpInviteCode?: string | null
  createdAt: Date
  updatedAt: Date
}

export type RsvpStatus = 'going' | 'maybe' | 'not_going'

export interface EventRsvp {
  userId: string
  status: RsvpStatus
  createdAt: Date
  updatedAt: Date
}
