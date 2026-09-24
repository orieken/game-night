import { describe, expect, it } from 'vitest'
import type { GameCatalogDetails } from '@/domain/entities/GameCatalog'
import { hasBggDuplicate, mapCatalogDetailsToGameDraft } from '@/domain/gameCatalogImport'

const details: GameCatalogDetails = {
  bggId: 30549,
  name: 'Pandemic',
  description: 'Work <strong>together</strong>.<br />Save the world.',
  yearPublished: 2008,
  thumbnailUrl: 'https://example.com/pandemic-thumb.jpg',
  imageUrl: 'https://example.com/pandemic.jpg',
  minPlayers: 2,
  maxPlayers: 4,
  playingTimeMinutes: 45,
  categories: ['Medical', 'Strategy'],
  mechanics: ['Cooperative Game'],
  complexityWeight: 2.41,
  sourceUrl: 'https://boardgamegeek.com/boardgame/30549'
}

describe('BoardGameGeek imports', () => {
  it('maps catalog details into editable local fields while preserving source metadata', () => {
    const importedAt = new Date('2026-09-24T12:00:00.000Z')

    expect(mapCatalogDetailsToGameDraft(details, importedAt)).toEqual({
      name: 'Pandemic',
      description: 'Work together.\nSave the world.',
      minPlayers: 2,
      maxPlayers: 4,
      avgDuration: 45,
      complexity: 'medium',
      categories: 'Medical, Strategy',
      imageUrl: 'https://example.com/pandemic.jpg',
      catalogData: { ...details, source: 'boardgamegeek', importedAt }
    })
  })

  it('uses safe local defaults when optional catalog values are absent', () => {
    const draft = mapCatalogDetailsToGameDraft({
      ...details,
      description: null,
      minPlayers: null,
      maxPlayers: null,
      playingTimeMinutes: null,
      complexityWeight: null,
      imageUrl: null,
      categories: []
    })

    expect(draft).toMatchObject({
      description: '',
      minPlayers: 1,
      maxPlayers: 1,
      avgDuration: null,
      complexity: null,
      categories: '',
      imageUrl: 'https://example.com/pandemic-thumb.jpg'
    })
  })

  it('detects the same BGG title but ignores manual games and other titles', () => {
    expect(hasBggDuplicate([{ bggId: null }, { bggId: 30549 }], 30549)).toBe(true)
    expect(hasBggDuplicate([{ bggId: null }, { bggId: 13 }], 30549)).toBe(false)
  })
})
