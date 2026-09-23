import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Campaign, CampaignStatus } from '@/domain/entities/Campaign'
import { campaignRepository } from '@/infrastructure/repositories/campaignRepository'

export const useCampaignStore = defineStore('campaign', () => {
  const campaigns = ref<Campaign[]>([])
  const currentCampaign = ref<Campaign | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCampaigns(groupId: string, status?: CampaignStatus) {
    loading.value = true
    error.value = null
    try {
      campaigns.value = await campaignRepository.getAll(groupId, status)
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to load campaigns.'
    } finally {
      loading.value = false
    }
  }

  async function fetchCampaignById(groupId: string, id: string) {
    loading.value = true
    error.value = null
    currentCampaign.value = null
    try {
      currentCampaign.value = await campaignRepository.getById(groupId, id)
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to load the campaign.'
    } finally {
      loading.value = false
    }
  }

  async function createCampaign(groupId: string, campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) {
    loading.value = true
    error.value = null
    try {
      const created = await campaignRepository.create(groupId, campaign)
      campaigns.value.push(created)
      return created
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to create the campaign.'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateCampaign(groupId: string, id: string, updates: Partial<Campaign>) {
    loading.value = true
    error.value = null
    try {
      const updated = await campaignRepository.update(groupId, id, updates)
      const index = campaigns.value.findIndex((campaign) => campaign.id === id)
      if (index !== -1) campaigns.value[index] = updated
      if (currentCampaign.value?.id === id) currentCampaign.value = updated
      return updated
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to update the campaign.'
      return null
    } finally {
      loading.value = false
    }
  }

  async function archiveCampaign(groupId: string, id: string) {
    loading.value = true
    error.value = null
    try {
      const archived = await campaignRepository.archive(groupId, id)
      const index = campaigns.value.findIndex((campaign) => campaign.id === id)
      if (index !== -1) campaigns.value[index] = archived
      if (currentCampaign.value?.id === id) currentCampaign.value = archived
      return archived
    } catch (caught: unknown) {
      error.value = caught instanceof Error ? caught.message : 'Unable to archive the campaign.'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    campaigns,
    currentCampaign,
    loading,
    error,
    fetchCampaigns,
    fetchCampaignById,
    createCampaign,
    updateCampaign,
    archiveCampaign
  }
})
