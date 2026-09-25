import { describe, expect, it } from 'vitest'
import { createHeroQuestCharacterFields } from '@/domain/campaignPresets'

describe('HeroQuest campaign preset', () => {
  it('includes the core persistent hero progression fields', () => {
    const fields = createHeroQuestCharacterFields()
    expect(fields.map((field) => field.id)).toEqual(expect.arrayContaining([
      'hero-type', 'body-points-current', 'body-points-max', 'mind-points-current',
      'mind-points-max', 'gold', 'weapons-armor', 'equipment-artifacts', 'spells', 'completed-quests'
    ]))
    expect(fields.find((field) => field.id === 'hero-type')?.required).toBe(true)
  })

  it('returns independent field copies', () => {
    const first = createHeroQuestCharacterFields()
    const second = createHeroQuestCharacterFields()
    first[0].label = 'Changed'
    expect(second[0].label).toBe('Hero type')
  })
})
