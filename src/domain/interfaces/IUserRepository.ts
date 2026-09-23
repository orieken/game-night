import type { User } from '@/domain/entities/User'

export interface IUserRepository {
  getCurrentUser(): Promise<User | null>
  updateProfile(userId: string, data: Partial<User>): Promise<User>
  createProfile(user: User): Promise<User>
}
