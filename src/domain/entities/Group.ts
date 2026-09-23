export type GroupRole = 'owner' | 'organizer' | 'member'

export interface Group {
  id: string
  name: string
  ownerId: string
  memberIds: string[]
  createdAt: Date
  updatedAt: Date
}

export interface GroupMember {
  userId: string
  role: GroupRole
  displayName: string
  avatarUrl: string | null
  joinedAt: Date
}
