/**
 * Event types for the Codenames game (event-sourcing).
 * See docs/game-backend-plan.md and docs/rules.md for reference.
 */

export enum GameEventType {
  GAME_CREATED = 'GAME_CREATED',
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
  PLAYER_CHOSE_SIDE = 'PLAYER_CHOSE_SIDE',
  PLAYER_DESIGNATED_SPY = 'PLAYER_DESIGNATED_SPY',
  GAME_FINISHED = 'GAME_FINISHED',
  GAME_RESTARTED = 'GAME_RESTARTED',
  ROUND_STARTED = 'ROUND_STARTED',
  CLUE_GIVEN = 'CLUE_GIVEN',
  WORD_SELECTED = 'WORD_SELECTED',
  WORD_HIGHLIGHTED = 'WORD_HIGHLIGHTED',
  WORD_UNHIGHLIGHTED = 'WORD_UNHIGHLIGHTED',
  TURN_PASSED = 'TURN_PASSED',
  PLAYER_KICKED = 'PLAYER_KICKED',
}

export type Side = 'red' | 'blue'

export enum CardType {
  NEUTRAL = 'neutral',
  RED = 'red',
  BLUE = 'blue',
  BLACK = 'black',
}
export interface GameCreatedPayload {
  creatorPseudo: string
  creatorToken: string
}

export interface PlayerJoinedPayload {
  playerId: string
  playerName: string
}

export interface PlayerLeftPayload {
  playerId: string
}

export interface PlayerChoseSidePayload {
  playerId: string
  playerName: string
  side: Side
}

export interface PlayerDesignatedSpyPayload {
  playerId: string
  playerName: string
  side: Side
}

export interface GameFinishedPayload {
  winningSide?: Side
  losingSide?: Side
}

export interface GameRestartedPayload {
  // Empty - no additional data
}

export interface RoundStartedPayload {
  words: string[]
  results: CardType[]
  order: number
  startingSide: Side
}

export interface ClueGivenPayload {
  word: string
  number: number
}

export interface WordSelectedPayload {
  wordIndex: number
  cardType: CardType
}

export interface WordHighlightedPayload {
  wordIndex: number
  playerId: string
  playerName: string
}

export interface WordUnhighlightedPayload {
  wordIndex: number
  playerId: string
}

export interface TurnPassedPayload {
  // Empty - no additional data
}

export type GameEventPayload =
  | GameCreatedPayload
  | PlayerJoinedPayload
  | PlayerLeftPayload
  | PlayerChoseSidePayload
  | PlayerDesignatedSpyPayload
  | GameFinishedPayload
  | GameRestartedPayload
  | RoundStartedPayload
  | ClueGivenPayload
  | WordSelectedPayload
  | WordHighlightedPayload
  | WordUnhighlightedPayload
  | TurnPassedPayload
