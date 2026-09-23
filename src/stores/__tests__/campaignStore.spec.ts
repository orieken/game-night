import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { campaignRepository } from '@/infrastructure/repositories/campaignRepository'
import { useCampaignStore } from '@/stores/campaignStore'

vi.mock('@/infrastructure/repositories/campaignRepository', () => ({
  campaignRepository: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn()
  }
}))

describe('campaignStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loads campaigns for the active group', async () => {
    const campaigns = [{ id: 'campaign-1', name: 'The Darkest Star' }]
    vi.mocked(campaignRepository.getAll).mockResolvedValue(campaigns as never)
    const store = useCampaignStore()

    await store.fetchCampaigns('group-1')

    expect(store.campaigns).toEqual(campaigns)
    expect(store.loading).toBe(false)
  })

  it('updates both campaign list and detail state', async () => {
    const original = { id: 'campaign-1', name: 'The Darkest Star', status: 'active' }
    const updated = { ...original, status: 'on_hold' }
    vi.mocked(campaignRepository.update).mockResolvedValue(updated as never)
    const store = useCampaignStore()
    store.campaigns = [original] as never
    store.currentCampaign = original as never

    await store.updateCampaign('group-1', 'campaign-1', { status: 'on_hold' })

    expect(store.campaigns[0]).toEqual(updated)
    expect(store.currentCampaign).toEqual(updated)
  })

  it('archives without deleting campaign history', async () => {
    const campaign = { id: 'campaign-1', name: 'The Darkest Star', status: 'archived' }
    vi.mocked(campaignRepository.archive).mockResolvedValue(campaign as never)
    const store = useCampaignStore()
    store.currentCampaign = { ...campaign, status: 'active' } as never

    await expect(store.archiveCampaign('group-1', 'campaign-1')).resolves.toEqual(campaign)
    expect(store.currentCampaign).toMatchObject({ status: 'archived' })
  })
})
