import type { EventRsvp, GameNight, RsvpStatus } from '@/domain/entities/GameNight'

export interface IGameNightRepository {
  getAll(groupId: string, status?: GameNight['status']): Promise<GameNight[]>
  getById(groupId: string, id: string): Promise<GameNight | null>
  create(groupId: string, gameNight: Omit<GameNight, 'id' | 'createdAt' | 'updatedAt'>): Promise<GameNight>
  update(groupId: string, id: string, data: Partial<GameNight>): Promise<GameNight>
  delete(groupId: string, id: string): Promise<void>
  getRsvps(groupId: string, eventId: string): Promise<EventRsvp[]>
  setRsvp(groupId: string, eventId: string, userId: string, status: RsvpStatus): Promise<{ rsvp: EventRsvp; attendeeCount: number }>
}
