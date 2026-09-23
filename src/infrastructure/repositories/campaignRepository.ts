import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import type { Campaign } from '@/domain/entities/Campaign'
import type { ICampaignRepository } from '@/domain/interfaces/ICampaignRepository'
import { getFirestoreDb } from '@/infrastructure/api/firebaseClient'
import { toCampaign, type CampaignDocument } from '@/infrastructure/mappers/campaignMapper'

function campaignsCollection(groupId: string) {
  return collection(getFirestoreDb(), 'groups', groupId, 'campaigns')
}

export const campaignRepository: ICampaignRepository = {
  async getAll(groupId, status): Promise<Campaign[]> {
    const constraints = status ? [where('status', '==', status), orderBy('name')] : [orderBy('name')]
    const snapshot = await getDocs(query(campaignsCollection(groupId), ...constraints))
    return snapshot.docs.map((campaign) => toCampaign(campaign.id, campaign.data() as CampaignDocument))
  },

  async getById(groupId, id): Promise<Campaign | null> {
    const snapshot = await getDoc(doc(campaignsCollection(groupId), id))
    return snapshot.exists() ? toCampaign(snapshot.id, snapshot.data() as CampaignDocument) : null
  },

  async create(groupId, campaign): Promise<Campaign> {
    const snapshot = await addDoc(campaignsCollection(groupId), {
      name: campaign.name,
      description: campaign.description,
      system: campaign.system,
      variant: campaign.variant,
      status: campaign.status,
      dmIds: campaign.dmIds,
      memberIds: campaign.memberIds,
      externalLinks: campaign.externalLinks,
      characterFieldDefinitions: campaign.characterFieldDefinitions,
      createdById: campaign.createdById,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    const created = await getDoc(snapshot)
    return toCampaign(created.id, created.data() as CampaignDocument)
  },

  async update(groupId, id, campaign): Promise<Campaign> {
    const updates = Object.fromEntries(Object.entries({
      name: campaign.name,
      description: campaign.description,
      system: campaign.system,
      variant: campaign.variant,
      status: campaign.status,
      dmIds: campaign.dmIds,
      memberIds: campaign.memberIds,
      externalLinks: campaign.externalLinks,
      characterFieldDefinitions: campaign.characterFieldDefinitions
    }).filter(([, value]) => value !== undefined))
    const campaignRef = doc(campaignsCollection(groupId), id)
    await updateDoc(campaignRef, { ...updates, updatedAt: serverTimestamp() })
    const updated = await getDoc(campaignRef)
    return toCampaign(updated.id, updated.data() as CampaignDocument)
  },

  archive(groupId, id): Promise<Campaign> {
    return campaignRepository.update(groupId, id, { status: 'archived' })
  }
}
