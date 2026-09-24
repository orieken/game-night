import { afterEach, describe, expect, it, vi } from 'vitest'
import { mapOpen5eDetails, mapOpen5eSummary, searchRules } from '../rpgRules'

const srd2024 = {
  key: 'srd-2024',
  name: 'System Reference Document 5.2',
  display_name: '5e 2024 Rules'
}

describe('Open5e rules adapter', () => {
  afterEach(() => vi.restoreAllMocks())

  it('maps an allowed spell into the app summary shape', () => {
    expect(mapOpen5eSummary({
      key: 'srd-2024_fireball',
      name: 'Fireball',
      document: srd2024,
      level: 3,
      school: { name: 'Evocation' }
    }, 'spells')).toEqual({
      key: 'srd-2024_fireball',
      providerResource: 'spells',
      resourceType: 'spell',
      name: 'Fireball',
      description: 'Level 3 · Evocation',
      edition: '2024',
      editionLabel: '2024 SRD',
      sourceName: 'System Reference Document 5.2'
    })
  })

  it('rejects content from a source outside the approved SRDs', () => {
    expect(() => mapOpen5eSummary({
      key: 'third-party_fireball',
      name: 'Fireball',
      document: { key: 'third-party-book' }
    }, 'spells')).toThrow('outside the approved SRD sources')
  })

  it('normalizes creature facts and actions without returning provider markup', () => {
    const details = mapOpen5eDetails({
      key: 'srd-2024_goblin',
      name: 'Goblin',
      document: srd2024,
      size: { name: 'Small' },
      type: { name: 'Fey' },
      challenge_rating: 0.25,
      armor_class: 15,
      hit_points: 7,
      actions: [{ name: 'Scimitar', desc: 'Melee attack for slashing damage.' }]
    }, 'creatures')

    expect(details.facts).toContainEqual({ label: 'Challenge rating', value: '0.25' })
    expect(details.sections).toEqual([{ title: 'Scimitar', body: 'Melee attack for slashing damage.' }])
    expect(details.sourceUrl).toBe('https://www.dndbeyond.com/srd')
  })

  it('enforces the source allowlist again after Open5e returns results', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      results: [
        { key: 'srd-2024_fireball', name: 'Fireball', document: srd2024, level: 3 },
        { key: 'other_fireball', name: 'Other Fireball', document: { key: 'other-source' }, level: 3 }
      ]
    })))

    await expect(searchRules('fireball', 'spell', '2024')).resolves.toMatchObject([
      { key: 'srd-2024_fireball', name: 'Fireball', edition: '2024' }
    ])
  })

  it('turns timeouts into a non-blocking product message', async () => {
    const timeout = Object.assign(new Error('timed out'), { name: 'TimeoutError' })
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(timeout)

    await expect(searchRules('fireball', 'spell', '2024')).rejects.toThrow(
      'Campaigns and characters are still available.'
    )
  })
})
