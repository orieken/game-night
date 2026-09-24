import type { VaultCharacter } from '@/domain/entities/VaultCharacter'

export interface IVaultCharacterRepository {
  getOwned(groupId: string, userId: string): Promise<VaultCharacter[]>
  getTableVisible(groupId: string): Promise<VaultCharacter[]>
  getById(groupId: string, id: string): Promise<VaultCharacter | null>
  create(groupId: string, character: Omit<VaultCharacter, 'id' | 'createdAt' | 'updatedAt'>): Promise<VaultCharacter>
  update(groupId: string, id: string, data: Partial<VaultCharacter>): Promise<VaultCharacter>
}
