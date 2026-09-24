import type { PublicStoryHighlight } from '@/domain/entities/PublicStoryHighlight'

export interface IPublicStoryHighlightRepository {
  getForSession(groupId: string, campaignId: string, logId: string): Promise<PublicStoryHighlight | null>
  publish(data: Omit<PublicStoryHighlight, 'id' | 'published' | 'publishedAt' | 'updatedAt'>): Promise<PublicStoryHighlight>
  unpublish(groupId: string, campaignId: string, logId: string, publishedById: string): Promise<PublicStoryHighlight>
}
