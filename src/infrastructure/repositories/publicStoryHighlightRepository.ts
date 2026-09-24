import { doc, getDoc, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore'
import type { IPublicStoryHighlightRepository } from '@/domain/interfaces/IPublicStoryHighlightRepository'
import { getFirestoreDb } from '@/infrastructure/api/firebaseClient'
import { toPublicStoryHighlight, type PublicStoryHighlightDocument } from '@/infrastructure/mappers/publicStoryHighlightMapper'

function highlightRef(groupId: string, campaignId: string, logId: string) {
  return doc(getFirestoreDb(), 'publicCampaignHighlights', groupId, 'campaigns', campaignId, 'sessions', logId)
}

export const publicStoryHighlightRepository: IPublicStoryHighlightRepository = {
  async getForSession(groupId, campaignId, logId) {
    const snapshot = await getDoc(highlightRef(groupId, campaignId, logId))
    return snapshot.exists() ? toPublicStoryHighlight(snapshot.id, snapshot.data() as PublicStoryHighlightDocument) : null
  },

  async publish(data) {
    const reference = highlightRef(data.groupId, data.campaignId, data.adventureLogId)
    const existing = await getDoc(reference)
    const values = {
      groupId: data.groupId,
      campaignId: data.campaignId,
      adventureLogId: data.adventureLogId,
      campaignName: data.campaignName,
      sessionNumber: data.sessionNumber,
      title: data.title,
      sessionDate: Timestamp.fromDate(data.sessionDate),
      excerpt: data.excerpt,
      published: true,
      publishedById: data.publishedById,
      updatedAt: serverTimestamp()
    }
    if (existing.exists()) await updateDoc(reference, values)
    else await setDoc(reference, { ...values, publishedAt: serverTimestamp() })
    const saved = await getDoc(reference)
    return toPublicStoryHighlight(saved.id, saved.data() as PublicStoryHighlightDocument)
  },

  async unpublish(groupId, campaignId, logId, publishedById) {
    const reference = highlightRef(groupId, campaignId, logId)
    await updateDoc(reference, { published: false, publishedById, updatedAt: serverTimestamp() })
    const saved = await getDoc(reference)
    return toPublicStoryHighlight(saved.id, saved.data() as PublicStoryHighlightDocument)
  }
}
