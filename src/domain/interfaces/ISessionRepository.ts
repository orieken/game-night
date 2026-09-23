import type { GameSession, SessionResultInput } from '@/domain/entities/GameSession'

export interface ISessionRepository {
  getAll(groupId: string, eventId: string): Promise<GameSession[]>
  create(groupId: string, eventId: string, gameId: string, createdBy: string, playerIds: string[], notes: string | null): Promise<GameSession>
  saveResults(groupId: string, eventId: string, sessionId: string, results: SessionResultInput[]): Promise<GameSession>
  delete(groupId: string, eventId: string, sessionId: string): Promise<void>
}
