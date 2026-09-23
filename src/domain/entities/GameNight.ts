export interface GameNight {
  id: string
  name: string
  description: string | null
  eventDate: Date
  location: string | null
  hostId: string
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled'
  maxAttendees: number | null
  isPublic: boolean
  invitedUserIds: string[]
  selectedGameIds: string[]
  attendeeCount: number
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
