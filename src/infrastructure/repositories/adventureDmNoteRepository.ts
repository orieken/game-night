import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import type { AdventureDmNote } from '@/domain/entities/AdventureDmNote'
import type { IAdventureDmNoteRepository } from '@/domain/interfaces/IAdventureDmNoteRepository'
import { getFirestoreDb } from '@/infrastructure/api/firebaseClient'
import { toAdventureDmNote, type AdventureDmNoteDocument } from '@/infrastructure/mappers/adventureDmNoteMapper'

function dmNoteRef(groupId: string, campaignId: string, logId: string) {
  return doc(getFirestoreDb(), 'groups', groupId, 'campaigns', campaignId, 'adventureLogs', logId, 'dmNotes', 'private')
}

export const adventureDmNoteRepository: IAdventureDmNoteRepository = {
  async get(groupId, campaignId, logId): Promise<AdventureDmNote | null> {
    const snapshot = await getDoc(dmNoteRef(groupId, campaignId, logId))
    return snapshot.exists() ? toAdventureDmNote(logId, snapshot.data() as AdventureDmNoteDocument) : null
  },

  async save(groupId, campaignId, logId, body, updatedById): Promise<AdventureDmNote> {
    const noteRef = dmNoteRef(groupId, campaignId, logId)
    const existing = await getDoc(noteRef)
    if (existing.exists()) {
      await updateDoc(noteRef, { body, updatedById, updatedAt: serverTimestamp() })
    } else {
      await setDoc(noteRef, { body, updatedById, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    }
    const saved = await getDoc(noteRef)
    return toAdventureDmNote(logId, saved.data() as AdventureDmNoteDocument)
  }
}
