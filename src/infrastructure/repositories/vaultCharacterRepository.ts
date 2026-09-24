import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import type { VaultCharacter } from '@/domain/entities/VaultCharacter'
import type { IVaultCharacterRepository } from '@/domain/interfaces/IVaultCharacterRepository'
import { getFirestoreDb } from '@/infrastructure/api/firebaseClient'
import { toVaultCharacter, type VaultCharacterDocument } from '@/infrastructure/mappers/vaultCharacterMapper'

function vaultCollection(groupId: string) {
  return collection(getFirestoreDb(), 'groups', groupId, 'characterVault')
}

function documentData(character: Omit<VaultCharacter, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    name: character.name,
    ownerId: character.ownerId,
    system: character.system,
    variant: character.variant,
    pronouns: character.pronouns,
    status: character.status,
    visibility: character.visibility,
    allowCopying: character.allowCopying,
    portraitUrl: character.portraitUrl,
    externalSheetUrl: character.externalSheetUrl,
    publicNotes: character.publicNotes,
    fieldDefinitions: character.fieldDefinitions,
    fieldValues: character.fieldValues,
    source: character.source,
    createdById: character.createdById
  }
}

export const vaultCharacterRepository: IVaultCharacterRepository = {
  async getOwned(groupId, userId) {
    const snapshot = await getDocs(query(vaultCollection(groupId), where('ownerId', '==', userId)))
    return snapshot.docs.map((item) => toVaultCharacter(item.id, item.data() as VaultCharacterDocument)).sort(byName)
  },

  async getTableVisible(groupId) {
    const snapshot = await getDocs(query(vaultCollection(groupId), where('visibility', '==', 'table')))
    return snapshot.docs.map((item) => toVaultCharacter(item.id, item.data() as VaultCharacterDocument)).sort(byName)
  },

  async getById(groupId, id) {
    const snapshot = await getDoc(doc(vaultCollection(groupId), id))
    return snapshot.exists() ? toVaultCharacter(snapshot.id, snapshot.data() as VaultCharacterDocument) : null
  },

  async create(groupId, character) {
    const reference = await addDoc(vaultCollection(groupId), {
      ...documentData(character),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    const created = await getDoc(reference)
    return toVaultCharacter(created.id, created.data() as VaultCharacterDocument)
  },

  async update(groupId, id, character) {
    const updates = Object.fromEntries(Object.entries({
      name: character.name,
      system: character.system,
      variant: character.variant,
      pronouns: character.pronouns,
      status: character.status,
      visibility: character.visibility,
      allowCopying: character.allowCopying,
      portraitUrl: character.portraitUrl,
      externalSheetUrl: character.externalSheetUrl,
      publicNotes: character.publicNotes,
      fieldDefinitions: character.fieldDefinitions,
      fieldValues: character.fieldValues
    }).filter(([, value]) => value !== undefined))
    const reference = doc(vaultCollection(groupId), id)
    await updateDoc(reference, { ...updates, updatedAt: serverTimestamp() })
    const updated = await getDoc(reference)
    return toVaultCharacter(updated.id, updated.data() as VaultCharacterDocument)
  }
}

function byName(left: VaultCharacter, right: VaultCharacter) {
  return left.name.localeCompare(right.name)
}
