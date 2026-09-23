import { describe, expect, it } from 'vitest'
import type { RsvpStatus } from '@/domain/entities/GameNight'
import { calculateRsvpAttendeeCount, type RsvpEventState } from '@/domain/rsvpValidation'

const event: RsvpEventState = {
  status: 'upcoming',
  hostId: 'host',
  isPublic: true,
  invitedUserIds: [],
  attendeeCount: 2,
  maxAttendees: 4
}

describe('calculateRsvpAttendeeCount', () => {
  it.each([
    [null, 'going', 3],
    ['maybe', 'going', 3],
    ['not_going', 'going', 3],
    ['going', 'maybe', 1],
    ['going', 'not_going', 1],
    ['going', 'going', 2],
    ['maybe', 'not_going', 2],
    ['not_going', 'maybe', 2]
  ] as [RsvpStatus | null, RsvpStatus, number][])('changes %s to %s and returns an attendee count of %i', (previousStatus, nextStatus, expected) => {
    expect(calculateRsvpAttendeeCount(event, 'member', previousStatus, nextStatus)).toBe(expected)
  })

  it('rejects a new going response when the event is full', () => {
    const fullEvent = { ...event, attendeeCount: 4 }

    expect(() => calculateRsvpAttendeeCount(fullEvent, 'member', 'maybe', 'going'))
      .toThrow('This game night is full.')
  })

  it('allows responses that do not add an attendee when the event is full', () => {
    const fullEvent = { ...event, attendeeCount: 4 }

    expect(calculateRsvpAttendeeCount(fullEvent, 'member', 'going', 'maybe')).toBe(3)
    expect(calculateRsvpAttendeeCount(fullEvent, 'member', 'maybe', 'not_going')).toBe(4)
  })

  it('allows invited users and the host to respond to a private event', () => {
    const privateEvent = { ...event, isPublic: false, invitedUserIds: ['invited'] }

    expect(calculateRsvpAttendeeCount(privateEvent, 'invited', null, 'going')).toBe(3)
    expect(calculateRsvpAttendeeCount(privateEvent, 'host', null, 'going')).toBe(3)
  })

  it('rejects an uninvited user from a private event', () => {
    const privateEvent = { ...event, isPublic: false, invitedUserIds: ['invited'] }

    expect(() => calculateRsvpAttendeeCount(privateEvent, 'outsider', null, 'going'))
      .toThrow('You need an invitation to RSVP to this game night.')
  })

  it.each(['in_progress', 'completed', 'cancelled'] as const)('rejects responses when the event is %s', (status) => {
    expect(() => calculateRsvpAttendeeCount({ ...event, status }, 'member', null, 'going'))
      .toThrow('RSVPs are closed for this game night.')
  })

  it('rejects an inconsistent transition that would make attendance negative', () => {
    expect(() => calculateRsvpAttendeeCount({ ...event, attendeeCount: 0 }, 'member', 'going', 'maybe'))
      .toThrow('Attendance count is invalid.')
  })
})
