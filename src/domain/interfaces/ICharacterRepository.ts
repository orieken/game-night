import type { Character } from '@/domain/entities/Character'

export interface ICharacterRepository {
  getAll(groupId: string, campaignId: string): Promise<Character[]>
  getById(groupId: string, campaignId: string, id: string): Promise<Character | null>
  create(groupId: string, campaignId: string, character: Omit<Character, 'id' | 'campaignId' | 'createdAt' | 'updatedAt'>): Promise<Character>
  update(groupId: string, campaignId: string, id: string, data: Partial<Character>): Promise<Character>
  retire(groupId: string, campaignId: string, id: string): Promise<Character>
}
