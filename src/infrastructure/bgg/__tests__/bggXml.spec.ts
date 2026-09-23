import { describe, expect, it } from 'vitest'
import { parseBggSearchXml, parseBggThingsXml } from '../bggXml'

describe('BoardGameGeek XML parsing', () => {
  it('parses search matches with their primary names and years', () => {
    const xml = `
      <items total="2">
        <item type="boardgame" id="13"><name type="primary" value="CATAN"/><yearpublished value="1995"/></item>
        <item type="boardgame" id="30549"><name type="alternate" value="Pandemie"/><name type="primary" value="Pandemic"/><yearpublished value="2008"/></item>
      </items>`

    expect(parseBggSearchXml(xml)).toEqual([
      { bggId: 13, name: 'CATAN', yearPublished: 1995 },
      { bggId: 30549, name: 'Pandemic', yearPublished: 2008 }
    ])
  })

  it('parses catalog details and keeps source metadata', () => {
    const xml = `
      <items>
        <item type="boardgame" id="30549">
          <thumbnail>https://example.com/pandemic-thumb.jpg</thumbnail>
          <image>https://example.com/pandemic.jpg</image>
          <name type="primary" value="Pandemic"/>
          <description>Work together to stop four diseases.</description>
          <yearpublished value="2008"/>
          <minplayers value="2"/><maxplayers value="4"/><playingtime value="45"/>
          <link type="boardgamecategory" id="2145" value="Medical"/>
          <link type="boardgamemechanic" id="2023" value="Cooperative Game"/>
          <statistics><ratings><averageweight value="2.41"/></ratings></statistics>
        </item>
      </items>`

    expect(parseBggThingsXml(xml)).toEqual([{
      bggId: 30549,
      name: 'Pandemic',
      yearPublished: 2008,
      thumbnailUrl: 'https://example.com/pandemic-thumb.jpg',
      imageUrl: 'https://example.com/pandemic.jpg',
      description: 'Work together to stop four diseases.',
      minPlayers: 2,
      maxPlayers: 4,
      playingTimeMinutes: 45,
      categories: ['Medical'],
      mechanics: ['Cooperative Game'],
      complexityWeight: 2.41,
      sourceUrl: 'https://boardgamegeek.com/boardgame/30549'
    }])
  })

  it('returns null for optional numeric fields instead of zero', () => {
    const xml = '<items><item type="boardgame" id="1"><name type="primary" value="Test Game"/></item></items>'
    const [game] = parseBggThingsXml(xml)

    expect(game?.yearPublished).toBeNull()
    expect(game?.minPlayers).toBeNull()
    expect(game?.complexityWeight).toBeNull()
  })
})
