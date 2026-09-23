import type { Game } from '@/domain/entities/Game'

export interface IGameRepository {
  getAll(groupId: string, availableOnly?: boolean): Promise<Game[]>
  getById(groupId: string, id: string): Promise<Game | null>
  create(groupId: string, game: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>): Promise<Game>
  update(groupId: string, id: string, data: Partial<Game>): Promise<Game>
}
