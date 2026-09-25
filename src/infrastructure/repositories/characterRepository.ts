import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import type { Character } from '@/domain/entities/Character'
import type { ICharacterRepository } from '@/domain/interfaces/ICharacterRepository'
import { getFirestoreDb } from '@/infrastructure/api/firebaseClient'
import { toCharacter, type CharacterDocument } from '@/infrastructure/mappers/characterMapper'

function charactersCollection(groupId: string, campaignId: string) {
  return collection(getFirestoreDb(), 'groups', groupId, 'campaigns', campaignId, 'characters')
}

export const characterRepository: ICharacterRepository = {
  async getAll(groupId, campaignId): Promise<Character[]> {
    const snapshot = await getDocs(query(charactersCollection(groupId, campaignId), orderBy('name')))
    return snapshot.docs.map((character) => toCharacter(campaignId, character.id, character.data() as CharacterDocument))
  },

  async getById(groupId, campaignId, id): Promise<Character | null> {
    const snapshot = await getDoc(doc(charactersCollection(groupId, campaignId), id))
    return snapshot.exists() ? toCharacter(campaignId, snapshot.id, snapshot.data() as CharacterDocument) : null
  },

  async create(groupId, campaignId, character): Promise<Character> {
    const snapshot = await addDoc(charactersCollection(groupId, campaignId), {
      name: character.name,
      ownershipType: character.ownershipType,
      playerId: character.playerId,
      controllerId: character.controllerId,
      pronouns: character.pronouns,
      status: character.status,
      portraitUrl: character.portraitUrl,
      externalSheetUrl: character.externalSheetUrl,
      publicNotes: character.publicNotes,
      allowCopying: character.allowCopying,
      fieldValues: character.fieldValues,
      createdById: character.createdById,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    const created = await getDoc(snapshot)
    return toCharacter(campaignId, created.id, created.data() as CharacterDocument)
  },

  async update(groupId, campaignId, id, character): Promise<Character> {
    const updates = Object.fromEntries(Object.entries({
      name: character.name,
      controllerId: character.controllerId,
      pronouns: character.pronouns,
      status: character.status,
      portraitUrl: character.portraitUrl,
      externalSheetUrl: character.externalSheetUrl,
      publicNotes: character.publicNotes,
      allowCopying: character.allowCopying,
      fieldValues: character.fieldValues
    }).filter(([, value]) => value !== undefined))
    const characterRef = doc(charactersCollection(groupId, campaignId), id)
    await updateDoc(characterRef, { ...updates, updatedAt: serverTimestamp() })
    const updated = await getDoc(characterRef)
    return toCharacter(campaignId, updated.id, updated.data() as CharacterDocument)
  },

  retire(groupId, campaignId, id): Promise<Character> {
    return characterRepository.update(groupId, campaignId, id, { status: 'retired' })
  }
}
