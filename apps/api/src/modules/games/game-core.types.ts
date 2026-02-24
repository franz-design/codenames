/**
 * Types for the Codenames game core logic.
 * See docs/game-backend-plan.md and docs/rules.md for reference.
 */

import type { CardType, GameEventType, Side } from './game-event.types'

export interface GameEventInput {
  id: string
  gameId: string
  roundId?: string | null
  eventType: GameEventType
  payload: Record<string, unknown>
  triggeredBy?: string | null
  createdAt: Date
}

export interface GameStatePlayer {
  id: string
  name: string
  side?: Side | null
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
  currentClue?: { word: string, number: number } | null
  guessesRemaining: number
  revealedWords: RevealedWord[]
  highlights: Record<number, { playerId: string, playerName: string }[]>
}

export interface GameState {
  status: 'LOBBY' | 'PLAYING' | 'FINISHED'
  players: GameStatePlayer[]
  currentRound?: RoundState | null
  winningSide?: Side | null
  losingSide?: Side | null
}

export interface GameOverResult {
  isOver: boolean
  winningSide?: Side | null
  losingSide?: Side | null
}

export type GameAction
  = | { type: 'giveClue', word: string, number: number }
    | { type: 'selectWord', wordIndex: number }
    | { type: 'highlightWord', wordIndex: number }
    | { type: 'unhighlightWord', wordIndex: number }
    | { type: 'passTurn' }
