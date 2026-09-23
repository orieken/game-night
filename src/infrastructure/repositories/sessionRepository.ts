import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore'
import type { GameSession, SessionPlayer } from '@/domain/entities/GameSession'
import type { ISessionRepository } from '@/domain/interfaces/ISessionRepository'
import { getFirestoreDb } from '@/infrastructure/api/firebaseClient'

interface SessionDocument {
  gameId: string
  createdBy: string
  status: GameSession['status']
  notes: string | null
  startedAt: Timestamp
  completedAt: Timestamp | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

function sessionsCollection(groupId: string, eventId: string) {
  return collection(getFirestoreDb(), 'groups', groupId, 'events', eventId, 'sessions')
}

function playersCollection(groupId: string, eventId: string, sessionId: string) {
  return collection(getFirestoreDb(), 'groups', groupId, 'events', eventId, 'sessions', sessionId, 'players')
}

async function loadSession(groupId: string, eventId: string, sessionId: string): Promise<GameSession> {
  const sessionSnapshot = await getDoc(doc(sessionsCollection(groupId, eventId), sessionId))
  if (!sessionSnapshot.exists()) throw new Error('Session not found.')
  const playersSnapshot = await getDocs(playersCollection(groupId, eventId, sessionId))
  const data = sessionSnapshot.data() as SessionDocument

  return {
    id: sessionSnapshot.id,
    gameId: data.gameId,
    createdBy: data.createdBy,
    status: data.status,
    notes: data.notes ?? null,
    startedAt: data.startedAt.toDate(),
    completedAt: data.completedAt?.toDate() ?? null,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    players: playersSnapshot.docs.map((player) => player.data() as SessionPlayer)
  }
}

export const sessionRepository: ISessionRepository = {
  async getAll(groupId, eventId) {
    const snapshot = await getDocs(query(sessionsCollection(groupId, eventId), orderBy('startedAt', 'desc')))
    return Promise.all(snapshot.docs.map((session) => loadSession(groupId, eventId, session.id)))
  },

  async create(groupId, eventId, gameId, createdBy, playerIds, notes) {
    const database = getFirestoreDb()
    const sessionRef = doc(sessionsCollection(groupId, eventId))
    const batch = writeBatch(database)

    batch.set(sessionRef, {
      gameId,
      createdBy,
      status: 'in_progress',
      notes,
      startedAt: serverTimestamp(),
      completedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    for (const userId of playerIds) {
      batch.set(doc(playersCollection(groupId, eventId, sessionRef.id), userId), {
        userId,
        placement: null,
        score: null,
        isWinner: false
      })
    }
    await batch.commit()
    return loadSession(groupId, eventId, sessionRef.id)
  },

  async saveResults(groupId, eventId, sessionId, results) {
    const database = getFirestoreDb()
    const sessionRef = doc(sessionsCollection(groupId, eventId), sessionId)
    const sessionSnapshot = await getDoc(sessionRef)
    if (!sessionSnapshot.exists()) throw new Error('Session not found.')
    const current = sessionSnapshot.data() as SessionDocument
    const batch = writeBatch(database)

    batch.update(sessionRef, {
      status: 'completed',
      completedAt: current.completedAt ?? serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    for (const result of results) {
      batch.update(doc(playersCollection(groupId, eventId, sessionId), result.userId), {
        placement: result.placement,
        score: result.score,
        isWinner: result.placement === 1
      })
    }
    await batch.commit()
    return loadSession(groupId, eventId, sessionId)
  },

  async delete(groupId, eventId, sessionId) {
    const database = getFirestoreDb()
    const players = await getDocs(playersCollection(groupId, eventId, sessionId))
    const batch = writeBatch(database)
    for (const player of players.docs) batch.delete(player.ref)
    batch.delete(doc(sessionsCollection(groupId, eventId), sessionId))
    await batch.commit()
  }
}
