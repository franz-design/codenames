export type Side = 'red' | 'blue'

export type CardType = 'neutral' | 'red' | 'blue' | 'black'

export const CLUE_NUMBER_INFINITY = 999

export interface GameStatePlayer {
  id: string
  name: string
  side: Side | null
  isSpy?: boolean
}

export interface RevealedWord {
  wordIndex: number
  cardType: CardType
}

export interface GameTimerSettings {
  isEnabled: boolean
  durationSeconds: number
}

export interface RoundState {
  id: string
  words: string[]
  results?: CardType[]
  order: number
  currentTurn: Side
  currentClue: { word: string, number: number } | null
  guessesRemaining: number
  revealedWords: RevealedWord[]
  /** Objectif : nombre total de mots équipe sur la grille (fourni par l’API) */
  wordsTotalBySide: { red: number, blue: number }
  /** Mots équipe encore non trouvés */
  wordsRemainingBySide: { red: number, blue: number }
  highlights: Record<string, { playerId: string, playerName: string }[]>
  turnStartedAt?: string | null
}

export interface GameState {
  status: 'LOBBY' | 'PLAYING' | 'FINISHED'
  players: GameStatePlayer[]
  currentRound: RoundState | null
  winningSide: Side | null
  losingSide: Side | null
  timerSettings?: GameTimerSettings | null
}

export interface Game {
  id: string
  creatorPseudo: string
  createdAt: string
}

export interface CreateGameResponse {
  game: Game
  creatorToken: string
  playerId: string
  gameState: GameState
}

export interface JoinGameResponse {
  gameState: GameState
  playerId: string
}

export interface TimelineItem {
  id: string
  type: 'event' | 'chat'
  eventType?: string
  payload: Record<string, unknown>
  triggeredBy: string | null
  playerName?: string
  createdAt: string
  roundId?: string | null
}

export interface TimelineResponse {
  data: TimelineItem[]
  meta: {
    itemCount: number
    pageSize: number
    offset: number
    hasMore: boolean
  }
}
