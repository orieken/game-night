import type { Group, GroupMember } from '@/domain/entities/Group'
import type { User } from '@/domain/entities/User'

export interface IGroupRepository {
  ensurePersonalGroup(user: User): Promise<Group>
  getForUser(userId: string): Promise<Group[]>
  getMembers(groupId: string): Promise<GroupMember[]>
  addMemberByEmail(groupId: string, email: string): Promise<GroupMember>
}
