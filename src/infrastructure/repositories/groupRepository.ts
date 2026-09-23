import { arrayUnion, collection, collectionGroup, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where, writeBatch } from 'firebase/firestore'
import { getFirestoreDb } from '@/infrastructure/api/firebaseClient'
import type { Group, GroupMember, GroupRole } from '@/domain/entities/Group'
import type { IGroupRepository } from '@/domain/interfaces/IGroupRepository'
import type { User } from '@/domain/entities/User'

interface GroupDocument {
  name: string
  ownerId: string
  memberIds: string[]
  createdAt: { toDate(): Date }
  updatedAt: { toDate(): Date }
}

interface GroupMemberDocument {
  userId: string
  role: GroupRole
  displayName: string
  avatarUrl: string | null
  joinedAt: { toDate(): Date }
}

export const groupRepository: IGroupRepository = {
  async ensurePersonalGroup(user: User): Promise<Group> {
    const database = getFirestoreDb()
    const groupRef = doc(database, 'groups', user.id)
    const memberRef = doc(groupRef, 'members', user.id)
    const existingGroup = await getDoc(groupRef)

    if (!existingGroup.exists()) {
      const batch = writeBatch(database)
      batch.set(groupRef, {
        name: `${user.username}'s game night`,
        ownerId: user.id,
        memberIds: [user.id],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      batch.set(memberRef, {
        userId: user.id,
        role: 'owner',
        displayName: user.displayName ?? user.username,
        avatarUrl: user.avatarUrl,
        joinedAt: serverTimestamp()
      })
      await batch.commit()
    } else {
      // Backfill the queryable userId on membership documents created before
      // multi-group selection was introduced.
      await setDoc(memberRef, {
        userId: user.id,
        role: 'owner',
        displayName: user.displayName ?? user.username,
        avatarUrl: user.avatarUrl
      }, { merge: true })
    }

    const group = await getDoc(groupRef)
    return toGroup(group.id, group.data() as GroupDocument)
  },

  async getForUser(userId: string): Promise<Group[]> {
    const database = getFirestoreDb()
    const memberships = await getDocs(query(
      collectionGroup(database, 'members'),
      where('userId', '==', userId)
    ))

    const groupSnapshots = await Promise.all(memberships.docs.map((membership) => {
      const groupRef = membership.ref.parent.parent
      if (!groupRef) throw new Error('Membership is missing its parent group.')
      return getDoc(groupRef)
    }))

    return groupSnapshots
      .filter((snapshot) => snapshot.exists())
      .map((snapshot) => toGroup(snapshot.id, snapshot.data() as GroupDocument))
      .sort((left, right) => left.name.localeCompare(right.name))
  },

  async getMembers(groupId: string): Promise<GroupMember[]> {
    const snapshot = await getDocs(collection(getFirestoreDb(), 'groups', groupId, 'members'))
    return snapshot.docs
      .map((member) => {
        const data = member.data() as GroupMemberDocument
        return {
          userId: member.id,
          role: data.role,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
          joinedAt: data.joinedAt.toDate()
        }
      })
  },

  async addMemberByEmail(groupId: string, email: string): Promise<GroupMember> {
    const database = getFirestoreDb()
    const users = await getDocs(query(
      collection(database, 'users'),
      where('email', '==', email.trim().toLowerCase()),
      limit(1)
    ))
    if (users.empty) throw new Error('No Game Night account was found for that email.')

    const user = users.docs[0]
    const profile = user.data() as { username: string; displayName: string | null; avatarUrl: string | null }
    const memberRef = doc(database, 'groups', groupId, 'members', user.id)
    const existingMember = await getDoc(memberRef)
    if (existingMember.exists()) {
      const data = existingMember.data() as GroupMemberDocument
      return {
        userId: existingMember.id,
        role: data.role,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        joinedAt: data.joinedAt.toDate()
      }
    }

    const batch = writeBatch(database)
    batch.set(memberRef, {
      userId: user.id,
      role: 'member',
      displayName: profile.displayName ?? profile.username,
      avatarUrl: profile.avatarUrl,
      joinedAt: serverTimestamp()
    })
    batch.update(doc(database, 'groups', groupId), {
      memberIds: arrayUnion(user.id),
      updatedAt: serverTimestamp()
    })
    await batch.commit()

    const member = await getDoc(memberRef)
    const data = member.data() as GroupMemberDocument
    return {
      userId: member.id,
      role: data.role,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
      joinedAt: data.joinedAt.toDate()
    }
  }
}

function toGroup(id: string, document: GroupDocument): Group {
  return {
    id,
    name: document.name,
    ownerId: document.ownerId,
    memberIds: document.memberIds,
    createdAt: document.createdAt.toDate(),
    updatedAt: document.updatedAt.toDate()
  }
}
