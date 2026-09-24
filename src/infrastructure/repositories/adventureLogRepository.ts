import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore'
import type { AdventureLog } from '@/domain/entities/AdventureLog'
import type { IAdventureLogRepository } from '@/domain/interfaces/IAdventureLogRepository'
import { getFirestoreDb } from '@/infrastructure/api/firebaseClient'
import { toAdventureLog, type AdventureLogDocument } from '@/infrastructure/mappers/adventureLogMapper'

function adventureLogsCollection(groupId: string, campaignId: string) {
  return collection(getFirestoreDb(), 'groups', groupId, 'campaigns', campaignId, 'adventureLogs')
}

export const adventureLogRepository: IAdventureLogRepository = {
  async getAll(groupId, campaignId): Promise<AdventureLog[]> {
    const snapshot = await getDocs(query(adventureLogsCollection(groupId, campaignId), orderBy('sessionDate', 'desc')))
    return snapshot.docs.map((log) => toAdventureLog(campaignId, log.id, log.data() as AdventureLogDocument))
  },

  async getById(groupId, campaignId, id): Promise<AdventureLog | null> {
    const snapshot = await getDoc(doc(adventureLogsCollection(groupId, campaignId), id))
    return snapshot.exists() ? toAdventureLog(campaignId, snapshot.id, snapshot.data() as AdventureLogDocument) : null
  },

  async create(groupId, campaignId, log): Promise<AdventureLog> {
    const snapshot = await addDoc(adventureLogsCollection(groupId, campaignId), {
      eventId: log.eventId,
      sessionNumber: log.sessionNumber,
      title: log.title,
      sessionDate: Timestamp.fromDate(log.sessionDate),
      attendeeIds: log.attendeeIds,
      characterIds: log.characterIds,
      recap: log.recap,
      progress: log.progress,
      loot: log.loot,
      quests: log.quests,
      memorableMoments: log.memorableMoments,
      nextSessionHooks: log.nextSessionHooks,
      createdById: log.createdById,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    const created = await getDoc(snapshot)
    return toAdventureLog(campaignId, created.id, created.data() as AdventureLogDocument)
  },

  async update(groupId, campaignId, id, log): Promise<AdventureLog> {
    const updates = Object.fromEntries(Object.entries({
      sessionNumber: log.sessionNumber,
      title: log.title,
      sessionDate: log.sessionDate && Timestamp.fromDate(log.sessionDate),
      attendeeIds: log.attendeeIds,
      characterIds: log.characterIds,
      recap: log.recap,
      progress: log.progress,
      loot: log.loot,
      quests: log.quests,
      memorableMoments: log.memorableMoments,
      nextSessionHooks: log.nextSessionHooks
    }).filter(([, value]) => value !== undefined))
    const logRef = doc(adventureLogsCollection(groupId, campaignId), id)
    await updateDoc(logRef, { ...updates, updatedAt: serverTimestamp() })
    const updated = await getDoc(logRef)
    return toAdventureLog(campaignId, updated.id, updated.data() as AdventureLogDocument)
  }
}
