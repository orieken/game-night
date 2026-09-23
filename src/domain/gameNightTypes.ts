import type { GameNightType } from '@/domain/entities/GameNight'

export const gameNightTypeOptions: ReadonlyArray<{
  value: GameNightType
  label: string
  description: string
}> = [
  {
    value: 'board_game',
    label: 'Board games',
    description: 'Choose games from the table library and record results.'
  },
  {
    value: 'tabletop_rpg',
    label: 'Tabletop RPG',
    description: 'Plan a D&D, Symbaroum, or other role-playing session.'
  },
  {
    value: 'mixed',
    label: 'Mixed night',
    description: 'Combine board games and tabletop role-playing.'
  }
]

export function gameNightTypeLabel(type: GameNightType): string {
  return gameNightTypeOptions.find((option) => option.value === type)?.label ?? 'Board games'
}
