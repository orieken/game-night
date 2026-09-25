import type { CampaignCharacterFieldDefinition } from '@/domain/entities/Campaign'

export const heroQuestCharacterFields: CampaignCharacterFieldDefinition[] = [
  { id: 'hero-type', label: 'Hero type', type: 'text', required: true, options: [] },
  { id: 'body-points-current', label: 'Current Body Points', type: 'number', required: false, options: [] },
  { id: 'body-points-max', label: 'Maximum Body Points', type: 'number', required: true, options: [] },
  { id: 'mind-points-current', label: 'Current Mind Points', type: 'number', required: false, options: [] },
  { id: 'mind-points-max', label: 'Maximum Mind Points', type: 'number', required: true, options: [] },
  { id: 'gold', label: 'Gold coins', type: 'number', required: false, options: [] },
  { id: 'weapons-armor', label: 'Weapons and armor', type: 'long_text', required: false, options: [] },
  { id: 'equipment-artifacts', label: 'Equipment and artifacts', type: 'long_text', required: false, options: [] },
  { id: 'spells', label: 'Spells', type: 'long_text', required: false, options: [] },
  { id: 'completed-quests', label: 'Completed quests', type: 'number', required: false, options: [] }
]

export function createHeroQuestCharacterFields(): CampaignCharacterFieldDefinition[] {
  return heroQuestCharacterFields.map((field) => ({ ...field, options: [...field.options] }))
}
