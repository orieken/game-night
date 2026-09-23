import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, runTransaction, serverTimestamp, Timestamp, updateDoc, where } from 'firebase/firestore'
import { getFirestoreDb } from '@/infrastructure/api/firebaseClient'
import type { EventRsvp, GameNight } from '@/domain/entities/GameNight'
import type { IGameNightRepository } from '@/domain/interfaces/IGameNightRepository'
import { calculateRsvpAttendeeCount } from '@/domain/rsvpValidation'
import { toGameNight, type GameNightDocument } from '@/infrastructure/mappers/gameNightMapper'

function eventsCollection(groupId: string) {
  return collection(getFirestoreDb(), 'groups', groupId, 'events')
}

function rsvpsCollection(groupId: string, eventId: string) {
  return collection(getFirestoreDb(), 'groups', groupId, 'events', eventId, 'rsvps')
}

export const gameNightRepository: IGameNightRepository = {
  async getAll(groupId, status): Promise<GameNight[]> {
    const constraints = status ? [where('status', '==', status), orderBy('eventDate')] : [orderBy('eventDate')]
    const snapshot = await getDocs(query(eventsCollection(groupId), ...constraints))
    return snapshot.docs.map((event) => toGameNight(event.id, event.data() as GameNightDocument))
  },

  async getById(groupId, id): Promise<GameNight | null> {
    const snapshot = await getDoc(doc(eventsCollection(groupId), id))
    return snapshot.exists() ? toGameNight(snapshot.id, snapshot.data() as GameNightDocument) : null
  },

  async create(groupId, gameNight): Promise<GameNight> {
    const snapshot = await addDoc(eventsCollection(groupId), {
      name: gameNight.name,
      description: gameNight.description,
      eventDate: Timestamp.fromDate(gameNight.eventDate),
      location: gameNight.location,
      hostId: gameNight.hostId,
      eventType: gameNight.eventType,
      status: gameNight.status,
      maxAttendees: gameNight.maxAttendees,
      isPublic: gameNight.isPublic,
      invitedUserIds: gameNight.invitedUserIds,
      selectedGameIds: gameNight.selectedGameIds,
      attendeeCount: gameNight.attendeeCount,
      rsvpInviteCode: gameNight.rsvpInviteCode ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    const created = await getDoc(snapshot)
    return toGameNight(created.id, created.data() as GameNightDocument)
  },

  async update(groupId, id, gameNight): Promise<GameNight> {
    const updates = Object.fromEntries(Object.entries({
      name: gameNight.name,
      description: gameNight.description,
      eventDate: gameNight.eventDate && Timestamp.fromDate(gameNight.eventDate),
      location: gameNight.location,
      eventType: gameNight.eventType,
      status: gameNight.status,
      maxAttendees: gameNight.maxAttendees,
      isPublic: gameNight.isPublic,
      invitedUserIds: gameNight.invitedUserIds,
      selectedGameIds: gameNight.selectedGameIds,
      attendeeCount: gameNight.attendeeCount
    }).filter(([, value]) => value !== undefined))
    const eventRef = doc(eventsCollection(groupId), id)
    await updateDoc(eventRef, { ...updates, updatedAt: serverTimestamp() })
    const updated = await getDoc(eventRef)
    return toGameNight(updated.id, updated.data() as GameNightDocument)
  },

  async delete(groupId, id): Promise<void> {
    await deleteDoc(doc(eventsCollection(groupId), id))
  },

  async getRsvps(groupId, eventId): Promise<EventRsvp[]> {
    const snapshot = await getDocs(rsvpsCollection(groupId, eventId))
    return snapshot.docs.map((rsvp) => toRsvp(rsvp.data() as RsvpDocument))
  },

  async setRsvp(groupId, eventId, userId, status) {
    const database = getFirestoreDb()
    const eventRef = doc(database, 'groups', groupId, 'events', eventId)
    const rsvpRef = doc(eventRef, 'rsvps', userId)

    const attendeeCount = await runTransaction(database, async (transaction) => {
      const [eventSnapshot, rsvpSnapshot] = await Promise.all([
        transaction.get(eventRef),
        transaction.get(rsvpRef)
      ])
      if (!eventSnapshot.exists()) throw new Error('Game night not found.')

      const event = eventSnapshot.data() as GameNightDocument
      const previousStatus = rsvpSnapshot.exists() ? (rsvpSnapshot.data() as RsvpDocument).status : null
      const nextAttendeeCount = calculateRsvpAttendeeCount({
        status: event.status,
        hostId: event.hostId,
        isPublic: event.isPublic,
        invitedUserIds: event.invitedUserIds ?? [],
        attendeeCount: event.attendeeCount ?? 0,
        maxAttendees: event.maxAttendees
      }, userId, previousStatus, status)

      transaction.update(eventRef, {
        attendeeCount: nextAttendeeCount,
        updatedAt: serverTimestamp()
      })
      transaction.set(rsvpRef, {
        userId,
        status,
        ...(!rsvpSnapshot.exists() && { createdAt: serverTimestamp() }),
        updatedAt: serverTimestamp()
      }, { merge: true })

      return nextAttendeeCount
    })

    const rsvpSnapshot = await getDoc(rsvpRef)
    return {
      rsvp: toRsvp(rsvpSnapshot.data() as RsvpDocument),
      attendeeCount
    }
  }
}

interface RsvpDocument {
  userId: string
  status: EventRsvp['status']
  createdAt: Timestamp
  updatedAt: Timestamp
}

function toRsvp(document: RsvpDocument): EventRsvp {
  return {
    userId: document.userId,
    status: document.status,
    createdAt: document.createdAt.toDate(),
    updatedAt: document.updatedAt.toDate()
  }
}
