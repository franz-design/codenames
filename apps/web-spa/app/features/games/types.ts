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

export interface RoundState {
  id: string
  words: string[]
  results: CardType[]
  order: number
  currentTurn: Side
  currentClue: { word: string, number: number } | null
  guessesRemaining: number
  revealedWords: RevealedWord[]
  highlights: Record<string, { playerId: string, playerName: string }[]>
}

export interface GameState {
  status: 'LOBBY' | 'PLAYING' | 'FINISHED'
  players: GameStatePlayer[]
  currentRound: RoundState | null
  winningSide: Side | null
  losingSide: Side | null
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
