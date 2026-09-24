import { Buffer } from 'node:buffer'
import { describe, expect, it } from 'vitest'
import { Timestamp } from 'firebase-admin/firestore'
import { createBackup, decodeFirestoreValue, encodeFirestoreValue, validateBackup } from '../../../scripts/lib/firestore-backup-format.mjs'

describe('Firestore backup format', () => {
  it('round-trips timestamps, byte values, and non-finite numbers', () => {
    const encoded = encodeFirestoreValue({
      happenedAt: Timestamp.fromDate(new Date('2026-09-24T12:00:00.000Z')),
      token: Buffer.from('game-night'),
      specialNumber: Number.POSITIVE_INFINITY
    })
    const decoded = decodeFirestoreValue(encoded, { doc: (path) => ({ path }) })

    expect(decoded.happenedAt.toDate().toISOString()).toBe('2026-09-24T12:00:00.000Z')
    expect(decoded.token.toString()).toBe('game-night')
    expect(decoded.specialNumber).toBe(Number.POSITIVE_INFINITY)
  })

  it('creates deterministic backups and validates document paths', () => {
    const backup = createBackup('rieken-game-night', [
      { path: 'users/user-1', data: { name: 'Player' } },
      { path: 'groups/group-1', data: { name: 'Family table' } }
    ], new Date('2026-09-24T12:00:00.000Z'))

    expect(validateBackup(backup)).toBe(backup)
    expect(backup.documents.map((document) => document.path)).toEqual(['groups/group-1', 'users/user-1'])
  })

  it('rejects tampered or malformed backups', () => {
    expect(() => validateBackup({
      format: 'game-night-firestore-backup',
      version: 1,
      projectId: 'rieken-game-night',
      createdAt: '2026-09-24T12:00:00.000Z',
      documentCount: 1,
      documents: [{ path: 'groups', data: {} }]
    })).toThrow('Invalid Firestore document path')
  })
})
