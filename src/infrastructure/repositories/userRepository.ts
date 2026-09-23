import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { getFirebaseAuth, getFirestoreDb } from '@/infrastructure/api/firebaseClient'
import type { IUserRepository } from '@/domain/interfaces/IUserRepository'
import type { User } from '@/domain/entities/User'
import { toUser, type UserProfileDocument } from '@/infrastructure/mappers/userMapper'

export const userRepository: IUserRepository = {
  async getCurrentUser(): Promise<User | null> {
    const authUser = getFirebaseAuth().currentUser
    if (!authUser) return null

    const profile = await getDoc(doc(getFirestoreDb(), 'users', authUser.uid))
    if (!profile.exists()) return null
    return toUser(profile.id, profile.data() as UserProfileDocument)
  },

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const profileRef = doc(getFirestoreDb(), 'users', userId)
    const updates = Object.fromEntries(Object.entries({
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
      bio: data.bio
    }).filter(([, value]) => value !== undefined))
    await updateDoc(profileRef, { ...updates, updatedAt: serverTimestamp() })
    const updated = await getDoc(profileRef)
    return toUser(updated.id, updated.data() as UserProfileDocument)
  },

  async createProfile(user: User): Promise<User> {
    const profileRef = doc(getFirestoreDb(), 'users', user.id)
    await setDoc(profileRef, {
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    const created = await getDoc(profileRef)
    return toUser(created.id, created.data() as UserProfileDocument)
  }
}
