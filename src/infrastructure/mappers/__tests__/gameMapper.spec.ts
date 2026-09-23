import { describe, expect, it } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import { toGame, type GameDocument } from '../gameMapper'

describe('gameMapper', () => {
  const date = new Date('2026-09-21T12:00:00.000Z')
  const timestamp = { toDate: () => date } as Timestamp
  const document: GameDocument = {
    name: 'Catan',
    description: 'Trading game',
    minPlayers: 3,
    maxPlayers: 4,
    avgDuration: 90,
    complexity: 'medium',
    category: ['Strategy'],
    imageUrl: 'http://test.com/img.jpg',
    bggId: 12345,
    isAvailable: true,
    createdAt: timestamp,
    updatedAt: timestamp
  }

  it('maps a Firestore game document to a domain entity', () => {
    expect(toGame('123', document)).toEqual({
      id: '123',
      name: 'Catan',
      description: 'Trading game',
      minPlayers: 3,
      maxPlayers: 4,
      avgDuration: 90,
      complexity: 'medium',
      category: ['Strategy'],
      imageUrl: 'http://test.com/img.jpg',
      bggId: 12345,
      isAvailable: true,
      createdAt: date,
      updatedAt: date
    })
  })
})
