/**
 * Pure game logic for Codenames.
 * State is computed from events (event-sourcing).
 * See docs/game-backend-plan.md and docs/rules.md for reference.
 */

import type {
  GameAction,
  GameEventInput,
  GameOverResult,
  GameState,
  RevealedWord,
} from './game-core.types'
import type { Side } from './game-event.types'
import { CardType, GameEventType } from './game-event.types'

export type {
  GameAction,
  GameEventInput,
  GameOverResult,
  GameState,
  GameStatePlayer,
  RevealedWord,
  RoundState,
} from './game-core.types'

/**
 * Generates the grid results for a round.
 * Rules: 1 black (assassin), 7 neutral, 8 red, 9 blue (or vice versa).
 * Order even: 8 red, 9 blue. Order odd: 9 red, 8 blue.
 */
export function generateGridResults(order: number): CardType[] {
  const results: CardType[] = []

  results.push(CardType.BLACK)

  for (let i = 0; i < 7; i++) {
    results.push(CardType.NEUTRAL)
  }

  const redCount = order % 2 === 0 ? 8 : 9
  const blueCount = order % 2 === 0 ? 9 : 8

  for (let i = 0; i < redCount; i++) {
    results.push(CardType.RED)
  }

  for (let i = 0; i < blueCount; i++) {
    results.push(CardType.BLUE)
  }

  for (let i = results.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[results[i], results[j]] = [results[j], results[i]]
  }

  return results
}

/**
 * Applies a single event to the state (incremental update).
 */
export function applyEvent(
  state: GameState,
  event: GameEventInput,
): GameState {
  const { eventType, payload, roundId } = event

  if (eventType === GameEventType.GAME_CREATED) {
    return {
      ...state,
      status: 'LOBBY',
      players: [],
    }
  }

  if (eventType === GameEventType.PLAYER_KICKED) {
    const { playerId } = payload as { playerId: string }
    return {
      ...state,
      players: state.players.filter(p => p.id !== playerId),
    }
  }

  if (eventType === GameEventType.PLAYER_JOINED) {
    const { playerId, playerName } = payload as { playerId: string, playerName: string }
    if (state.players.some(p => p.id === playerId))
      return state
    return {
      ...state,
      players: [...state.players, { id: playerId, name: playerName }],
    }
  }

  if (eventType === GameEventType.PLAYER_LEFT) {
    const { playerId } = payload as { playerId: string }
    return {
      ...state,
      players: state.players.filter(p => p.id !== playerId),
    }
  }

  if (eventType === GameEventType.PLAYER_CHOSE_SIDE) {
    const { playerId, playerName, side } = payload as { playerId: string, playerName: string, side: Side }
    const players = state.players.map(p =>
      p.id === playerId ? { ...p, name: playerName, side } : p,
    )
    if (!players.some(p => p.id === playerId)) {
      players.push({ id: playerId, name: playerName, side })
    }
    return { ...state, players }
  }

  if (eventType === GameEventType.PLAYER_DESIGNATED_SPY) {
    const { playerId, playerName, side } = payload as { playerId: string, playerName: string, side: Side }
    const players = state.players.map(p =>
      p.id === playerId
        ? { ...p, name: playerName, side, isSpy: true }
        : p.side === side && p.isSpy
          ? { ...p, isSpy: false }
          : p,
    )
    if (!players.some(p => p.id === playerId)) {
      players.push({ id: playerId, name: playerName, side, isSpy: true })
    }
    return { ...state, players }
  }

  if (eventType === GameEventType.GAME_FINISHED) {
    const { winningSide, losingSide } = payload as { winningSide?: Side, losingSide?: Side }
    return {
      ...state,
      status: 'FINISHED',
      winningSide: winningSide ?? null,
      losingSide: losingSide ?? null,
    }
  }

  if (eventType === GameEventType.GAME_RESTARTED) {
    return {
      ...state,
      status: 'LOBBY',
      players: state.players.map(p => ({ ...p, isSpy: false })),
      currentRound: undefined,
      winningSide: undefined,
      losingSide: undefined,
    }
  }

  if (eventType === GameEventType.ROUND_STARTED && state.currentRound) {
    const { words, results, order, startingSide } = payload as {
      words: string[]
      results: CardType[]
      order: number
      startingSide: Side
    }
    return {
      ...state,
      status: 'PLAYING',
      currentRound: {
        id: roundId!,
        words,
        results,
        order,
        currentTurn: startingSide,
        currentClue: null,
        guessesRemaining: 0,
        revealedWords: [],
        highlights: {},
      },
    }
  }

  if (!state.currentRound)
    return state

  const round = { ...state.currentRound }

  if (eventType === GameEventType.CLUE_GIVEN) {
    const { word, number } = payload as { word: string, number: number }
    round.currentClue = { word, number }
    round.guessesRemaining = number + 1
    return { ...state, currentRound: round }
  }

  if (eventType === GameEventType.WORD_SELECTED) {
    const { wordIndex, cardType } = payload as { wordIndex: number, cardType: CardType }
    round.revealedWords = [...round.revealedWords, { wordIndex, cardType }]
    if (cardType === round.currentTurn) {
      round.guessesRemaining -= 1
    }
    delete round.highlights[wordIndex]
    return { ...state, currentRound: round }
  }

  if (eventType === GameEventType.WORD_HIGHLIGHTED) {
    const { wordIndex, playerId, playerName } = payload as {
      wordIndex: number
      playerId: string
      playerName: string
    }
    const list = round.highlights[wordIndex] ?? []
    if (!list.some(h => h.playerId === playerId)) {
      round.highlights[wordIndex] = [...list, { playerId, playerName }]
    }
    return { ...state, currentRound: round }
  }

  if (eventType === GameEventType.WORD_UNHIGHLIGHTED) {
    const { wordIndex, playerId } = payload as { wordIndex: number, playerId: string }
    const list = (round.highlights[wordIndex] ?? []).filter(h => h.playerId !== playerId)
    if (list.length === 0)
      delete round.highlights[wordIndex]
    else
      round.highlights[wordIndex] = list
    return { ...state, currentRound: round }
  }

  if (eventType === GameEventType.TURN_PASSED) {
    round.currentTurn = round.currentTurn === 'red' ? 'blue' : 'red'
    round.currentClue = null
    round.guessesRemaining = 0
    round.highlights = {}
    return { ...state, currentRound: round }
  }

  if (eventType === GameEventType.CHAT_MESSAGE) {
    return state
  }

  return state
}

/**
 * Computes the full game state by replaying all events.
 */
export function computeGameState(events: GameEventInput[]): GameState {
  const initialState: GameState = {
    status: 'LOBBY',
    players: [],
  }

  let state = initialState
  let currentRoundId: string | null = null

  for (const event of events) {
    if (event.eventType === GameEventType.ROUND_STARTED) {
      const { words, results, order, startingSide } = event.payload as {
        words: string[]
        results: CardType[]
        order: number
        startingSide: Side
      }
      currentRoundId = event.roundId ?? null
      state = {
        ...state,
        status: 'PLAYING',
        currentRound: {
          id: currentRoundId!,
          words,
          results,
          order,
          currentTurn: startingSide,
          currentClue: null,
          guessesRemaining: 0,
          revealedWords: [],
          highlights: {},
        },
      }
    }
    else if (event.roundId == null || event.roundId === currentRoundId) {
      state = applyEvent(state, event)
      if (event.eventType === GameEventType.GAME_RESTARTED)
        currentRoundId = null
    }
  }

  return state
}

/**
 * Checks if the game is over based on revealed words and grid results.
 * Win: all team cards found. Lose: assassin (black) clicked.
 * @param revealedWords - Words revealed so far
 * @param results - Grid card types
 * @param currentTurn - The team whose turn it was when the last word was selected (used when black is clicked)
 */
export function checkGameOver(
  revealedWords: RevealedWord[],
  results: CardType[],
  currentTurn?: Side,
): GameOverResult {
  const hasBlack = revealedWords.some(r => r.cardType === CardType.BLACK)
  if (hasBlack) {
    return {
      isOver: true,
      losingSide: currentTurn ?? 'blue',
      winningSide: currentTurn === 'red' ? 'blue' : 'red',
    }
  }

  const redCount = results.filter(r => r === CardType.RED).length
  const blueCount = results.filter(r => r === CardType.BLUE).length
  const redRevealed = revealedWords.filter(r => r.cardType === CardType.RED).length
  const blueRevealed = revealedWords.filter(r => r.cardType === CardType.BLUE).length

  if (redRevealed === redCount)
    return { isOver: true, winningSide: 'red' }
  if (blueRevealed === blueCount)
    return { isOver: true, winningSide: 'blue' }

  return { isOver: false }
}

/**
 * Validates if a player can perform an action.
 */
export function canPerformAction(
  state: GameState,
  action: GameAction,
  playerId: string,
): boolean {
  const player = state.players.find(p => p.id === playerId)
  if (!player)
    return false

  if (action.type === 'giveClue') {
    if (state.status !== 'PLAYING' || !state.currentRound)
      return false
    if (player.side !== state.currentRound.currentTurn)
      return false
    if (!player.isSpy)
      return false
    if (state.currentRound.currentClue)
      return false
    return true
  }

  if (action.type === 'selectWord') {
    if (state.status !== 'PLAYING' || !state.currentRound)
      return false
    if (player.isSpy)
      return false
    if (player.side !== state.currentRound.currentTurn)
      return false
    if (state.currentRound.guessesRemaining <= 0)
      return false
    const alreadyRevealed = state.currentRound.revealedWords.some(
      r => r.wordIndex === action.wordIndex,
    )
    return !alreadyRevealed
  }

  if (action.type === 'highlightWord' || action.type === 'unhighlightWord') {
    if (state.status !== 'PLAYING' || !state.currentRound)
      return false
    if (player.isSpy)
      return false
    if (player.side !== state.currentRound.currentTurn)
      return false
    const alreadyRevealed = state.currentRound.revealedWords.some(
      r => r.wordIndex === action.wordIndex,
    )
    return !alreadyRevealed
  }

  if (action.type === 'passTurn') {
    if (state.status !== 'PLAYING' || !state.currentRound)
      return false
    if (player.isSpy)
      return false
    if (player.side !== state.currentRound.currentTurn)
      return false
    return true
  }

  return false
}
