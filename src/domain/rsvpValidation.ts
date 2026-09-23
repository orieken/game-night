import type { GameNight, RsvpStatus } from '@/domain/entities/GameNight'

export interface RsvpEventState {
  status: GameNight['status']
  hostId: string
  isPublic: boolean
  invitedUserIds: string[]
  attendeeCount: number
  maxAttendees: number | null
}

export function calculateRsvpAttendeeCount(
  event: RsvpEventState,
  userId: string,
  previousStatus: RsvpStatus | null,
  nextStatus: RsvpStatus
): number {
  if (event.status !== 'upcoming') {
    throw new Error('RSVPs are closed for this game night.')
  }

  if (!event.isPublic && event.hostId !== userId && !event.invitedUserIds.includes(userId)) {
    throw new Error('You need an invitation to RSVP to this game night.')
  }

  const attendanceDelta = Number(nextStatus === 'going') - Number(previousStatus === 'going')
  const nextAttendeeCount = event.attendeeCount + attendanceDelta

  if (nextAttendeeCount < 0) {
    throw new Error('Attendance count is invalid.')
  }

  if (event.maxAttendees !== null && nextAttendeeCount > event.maxAttendees) {
    throw new Error('This game night is full.')
  }

  return nextAttendeeCount
}
