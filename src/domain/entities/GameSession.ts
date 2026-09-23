export type GameSessionStatus = 'in_progress' | 'completed'

export interface GameSession {
  id: string
  gameId: string
  createdBy: string
  status: GameSessionStatus
  notes: string | null
  startedAt: Date
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
  players: SessionPlayer[]
}

export interface SessionPlayer {
  userId: string
  placement: number | null
  score: number | null
  isWinner: boolean
}

export interface SessionResultInput {
  userId: string
  placement: number
  score: number | null
}
