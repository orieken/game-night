import type { User } from '@/domain/entities/User'
import type { Timestamp } from 'firebase/firestore'

export interface UserProfileDocument {
  email: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

export function toUser(id: string, row: UserProfileDocument): User {
  return {
    id,
    email: row.email,
    username: row.username,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    createdAt: row.createdAt.toDate(),
    updatedAt: row.updatedAt.toDate()
  }
}
