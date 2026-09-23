import type { GameNight } from '@/domain/entities/GameNight'
import type { Timestamp } from 'firebase/firestore'

export interface GameNightDocument {
  name: string
  description: string | null
  eventDate: Timestamp
  location: string | null
  hostId: string
  status: GameNight['status']
  maxAttendees: number | null
  isPublic: boolean
  invitedUserIds?: string[]
  selectedGameIds?: string[]
  attendeeCount?: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export function toGameNight(id: string, row: GameNightDocument): GameNight {
  return {
    id,
    name: row.name,
    description: row.description,
    eventDate: row.eventDate.toDate(),
    location: row.location,
    hostId: row.hostId,
    status: row.status,
    maxAttendees: row.maxAttendees,
    isPublic: row.isPublic,
    invitedUserIds: row.invitedUserIds ?? [],
    selectedGameIds: row.selectedGameIds ?? [],
    attendeeCount: row.attendeeCount ?? 0,
    createdAt: row.createdAt.toDate(),
    updatedAt: row.updatedAt.toDate()
  }
}
