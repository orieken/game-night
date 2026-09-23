import { arrayUnion, doc, getDoc, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore'
import type { EventInvite } from '@/domain/entities/EventInvite'
import type { GameNight } from '@/domain/entities/GameNight'
import type { User } from '@/domain/entities/User'
import { getFirestoreDb } from '@/infrastructure/api/firebaseClient'

interface EventInviteDocument {
  code: string
  groupId: string
  eventId: string
  eventName: string
  eventDate: Timestamp
  location: string | null
  active: boolean
}

export const eventInviteRepository = {
  async create(groupId: string, event: GameNight): Promise<string> {
    const database = getFirestoreDb()
    const code = event.rsvpInviteCode ?? globalThis.crypto.randomUUID().replace(/-/g, '')
    const inviteRef = doc(database, 'eventInvites', code)
    const existingInvite = await getDoc(inviteRef)

    if (!existingInvite.exists()) {
      const batch = writeBatch(database)
      batch.update(doc(database, 'groups', groupId, 'events', event.id), {
        rsvpInviteCode: code,
        updatedAt: serverTimestamp()
      })
      batch.set(inviteRef, {
        code,
        groupId,
        eventId: event.id,
        eventName: event.name,
        eventDate: Timestamp.fromDate(event.eventDate),
        location: event.location,
        active: true,
        createdBy: event.hostId,
        createdAt: serverTimestamp()
      })
      await batch.commit()
    }

    return code
  },

  async getByCode(code: string): Promise<EventInvite | null> {
    const snapshot = await getDoc(doc(getFirestoreDb(), 'eventInvites', code))
    if (!snapshot.exists()) return null
    const invite = snapshot.data() as EventInviteDocument
    return {
      code: invite.code,
      groupId: invite.groupId,
      eventId: invite.eventId,
      eventName: invite.eventName,
      eventDate: invite.eventDate.toDate(),
      location: invite.location,
      active: invite.active
    }
  },

  async accept(invite: EventInvite, user: User): Promise<void> {
    if (!invite.active) throw new Error('This RSVP link is no longer active.')

    const database = getFirestoreDb()
    const groupRef = doc(database, 'groups', invite.groupId)
    const memberRef = doc(groupRef, 'members', user.id)
    const eventRef = doc(groupRef, 'events', invite.eventId)
    const membership = await getDoc(memberRef)
    const batch = writeBatch(database)

    if (membership.exists()) {
      batch.update(memberRef, { inviteCode: invite.code })
    } else {
      batch.set(memberRef, {
        userId: user.id,
        role: 'member',
        displayName: user.displayName ?? user.username,
        avatarUrl: user.avatarUrl,
        inviteCode: invite.code,
        joinedAt: serverTimestamp()
      })
    }

    batch.update(groupRef, {
      memberIds: arrayUnion(user.id),
      updatedAt: serverTimestamp()
    })
    batch.update(eventRef, {
      invitedUserIds: arrayUnion(user.id),
      updatedAt: serverTimestamp()
    })
    await batch.commit()
  }
}
