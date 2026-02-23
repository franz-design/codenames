import type { GameEventInput } from './game-core.logic'
import {
  applyEvent,
  canPerformAction,
  checkGameOver,
  computeGameState,
  generateGridResults,
} from './game-core.logic'
import { CardType, GameEventType } from './game-event.types'

describe('game-core.logic', () => {
  describe('generateGridResults', () => {
    it('should generate 25 cards', () => {
      const results = generateGridResults(1)
      expect(results).toHaveLength(25)
    })

    it('should contain exactly 1 black card', () => {
      const results = generateGridResults(1)
      expect(results.filter(r => r === CardType.BLACK)).toHaveLength(1)
    })

    it('should contain exactly 7 neutral cards', () => {
      const results = generateGridResults(1)
      expect(results.filter(r => r === CardType.NEUTRAL)).toHaveLength(7)
    })

    it('should contain 9 red and 8 blue when order is odd', () => {
      const results = generateGridResults(1)
      expect(results.filter(r => r === CardType.RED)).toHaveLength(9)
      expect(results.filter(r => r === CardType.BLUE)).toHaveLength(8)
    })

    it('should contain 8 red and 9 blue when order is even', () => {
      const results = generateGridResults(2)
      expect(results.filter(r => r === CardType.RED)).toHaveLength(8)
      expect(results.filter(r => r === CardType.BLUE)).toHaveLength(9)
    })
  })

  describe('applyEvent', () => {
    it('should apply GAME_CREATED', () => {
      const state = { status: 'LOBBY' as const, players: [] }
      const event: GameEventInput = {
        id: '1',
        gameId: 'g1',
        eventType: GameEventType.GAME_CREATED,
        payload: { creatorPseudo: 'Alice', creatorToken: 'token-123' },
        triggeredBy: null,
        createdAt: new Date(),
      }
      const result = applyEvent(state as never, event)
      expect(result.status).toBe('LOBBY')
      expect(result.players).toEqual([])
    })

    it('should apply PLAYER_JOINED', () => {
      const state = { status: 'LOBBY' as const, players: [] }
      const event: GameEventInput = {
        id: '1',
        gameId: 'g1',
        eventType: GameEventType.PLAYER_JOINED,
        payload: { playerId: 'u1', playerName: 'Alice' },
        triggeredBy: 'u1',
        createdAt: new Date(),
      }
      const result = applyEvent(state as never, event)
      expect(result.players).toHaveLength(1)
      expect(result.players[0]).toEqual({ id: 'u1', name: 'Alice' })
    })

    it('should apply WORD_HIGHLIGHTED and build highlights map', () => {
      const state = {
        status: 'PLAYING' as const,
        players: [{ id: 'u1', name: 'Alice', side: 'red' as const }],
        currentRound: {
          id: 'r1',
          words: ['a', 'b', 'c'],
          results: [CardType.RED, CardType.BLUE, CardType.NEUTRAL],
          order: 1,
          currentTurn: 'red' as const,
          currentClue: null,
          guessesRemaining: 1,
          revealedWords: [],
          highlights: {},
        },
      }
      const event: GameEventInput = {
        id: '1',
        gameId: 'g1',
        roundId: 'r1',
        eventType: GameEventType.WORD_HIGHLIGHTED,
        payload: { wordIndex: 0, playerId: 'u1', playerName: 'Alice' },
        triggeredBy: 'u1',
        createdAt: new Date(),
      }
      const result = applyEvent(state as never, event)
      expect(result.currentRound?.highlights[0]).toEqual([
        { playerId: 'u1', playerName: 'Alice' },
      ])
    })

    it('should apply WORD_UNHIGHLIGHTED and remove player from highlights', () => {
      const state = {
        status: 'PLAYING' as const,
        players: [],
        currentRound: {
          id: 'r1',
          words: ['a', 'b'],
          results: [CardType.RED, CardType.BLUE],
          order: 1,
          currentTurn: 'red' as const,
          currentClue: null,
          guessesRemaining: 1,
          revealedWords: [],
          highlights: { 0: [{ playerId: 'u1', playerName: 'Alice' }] },
        },
      }
      const event: GameEventInput = {
        id: '1',
        gameId: 'g1',
        roundId: 'r1',
        eventType: GameEventType.WORD_UNHIGHLIGHTED,
        payload: { wordIndex: 0, playerId: 'u1' },
        triggeredBy: 'u1',
        createdAt: new Date(),
      }
      const result = applyEvent(state as never, event)
      expect(result.currentRound?.highlights[0]).toBeUndefined()
    })
  })

  describe('computeGameState', () => {
    it('should compute full state from events', () => {
      const events: GameEventInput[] = [
        {
          id: '1',
          gameId: 'g1',
          eventType: GameEventType.GAME_CREATED,
          payload: { creatorPseudo: 'Alice', creatorToken: 'token-123' },
          triggeredBy: 'u1',
          createdAt: new Date(),
        },
        {
          id: '2',
          gameId: 'g1',
          eventType: GameEventType.PLAYER_JOINED,
          payload: { playerId: 'u1', playerName: 'Alice' },
          triggeredBy: 'u1',
          createdAt: new Date(),
        },
        {
          id: '3',
          gameId: 'g1',
          eventType: GameEventType.PLAYER_CHOSE_SIDE,
          payload: { playerId: 'u1', playerName: 'Alice', side: 'red' },
          triggeredBy: 'u1',
          createdAt: new Date(),
        },
      ]
      const state = computeGameState(events)
      expect(state.status).toBe('LOBBY')
      expect(state.players).toHaveLength(1)
      expect(state.players[0]).toEqual({
        id: 'u1',
        name: 'Alice',
        side: 'red',
      })
    })

    it('should include highlights in currentRound', () => {
      const words = ['a', 'b', 'c', 'd', 'e']
      const results: CardType[] = [
        CardType.RED,
        CardType.BLUE,
        CardType.NEUTRAL,
        CardType.RED,
        CardType.BLUE,
      ]
      const events: GameEventInput[] = [
        {
          id: '1',
          gameId: 'g1',
          eventType: GameEventType.GAME_CREATED,
          payload: { creatorPseudo: 'Alice', creatorToken: 'token-123' },
          triggeredBy: 'u1',
          createdAt: new Date(),
        },
        {
          id: '2',
          gameId: 'g1',
          roundId: 'r1',
          eventType: GameEventType.ROUND_STARTED,
          payload: {
            words,
            results,
            order: 1,
            startingSide: 'red',
          },
          triggeredBy: 'u1',
          createdAt: new Date(),
        },
        {
          id: '3',
          gameId: 'g1',
          roundId: 'r1',
          eventType: GameEventType.WORD_HIGHLIGHTED,
          payload: { wordIndex: 0, playerId: 'u1', playerName: 'Alice' },
          triggeredBy: 'u1',
          createdAt: new Date(),
        },
        {
          id: '4',
          gameId: 'g1',
          roundId: 'r1',
          eventType: GameEventType.WORD_HIGHLIGHTED,
          payload: { wordIndex: 0, playerId: 'u2', playerName: 'Bob' },
          triggeredBy: 'u2',
          createdAt: new Date(),
        },
      ]
      const state = computeGameState(events)
      expect(state.currentRound?.highlights[0]).toHaveLength(2)
      expect(state.currentRound?.highlights[0]).toContainEqual({
        playerId: 'u1',
        playerName: 'Alice',
      })
      expect(state.currentRound?.highlights[0]).toContainEqual({
        playerId: 'u2',
        playerName: 'Bob',
      })
    })
  })

  describe('checkGameOver', () => {
    it('should return isOver when black is revealed', () => {
      const result = checkGameOver(
        [{ wordIndex: 0, cardType: CardType.BLACK }],
        [CardType.BLACK, CardType.RED, CardType.BLUE],
        'red',
      )
      expect(result.isOver).toBe(true)
      expect(result.losingSide).toBe('red')
      expect(result.winningSide).toBe('blue')
    })

    it('should return isOver when all red cards are revealed', () => {
      const results = [CardType.RED, CardType.RED, CardType.BLUE, CardType.BLUE, CardType.NEUTRAL]
      const revealedWords = [
        { wordIndex: 0, cardType: CardType.RED },
        { wordIndex: 1, cardType: CardType.RED },
      ]
      const gameOver = checkGameOver(revealedWords, results)
      expect(gameOver.isOver).toBe(true)
      expect(gameOver.winningSide).toBe('red')
    })

    it('should return isOver false when game continues', () => {
      const results: CardType[] = [CardType.RED, CardType.RED, CardType.BLUE, CardType.BLUE, CardType.NEUTRAL]
      const revealedWords = [{ wordIndex: 0, cardType: CardType.RED }]
      const gameOver = checkGameOver(revealedWords, results)
      expect(gameOver.isOver).toBe(false)
    })
  })

  describe('canPerformAction', () => {
    const baseState = {
      status: 'PLAYING' as const,
      players: [
        { id: 'spy', name: 'Spy', side: 'red' as const, isSpy: true },
        { id: 'guesser', name: 'Guesser', side: 'red' as const, isSpy: false },
      ],
      currentRound: {
        id: 'r1',
        words: ['a', 'b', 'c'],
        results: [CardType.RED, CardType.BLUE, CardType.NEUTRAL],
        order: 1,
        currentTurn: 'red' as const,
        currentClue: null,
        guessesRemaining: 2,
        revealedWords: [],
        highlights: {},
      },
    }

    it('should allow spy to give clue when no clue given', () => {
      const result = canPerformAction(
        baseState as never,
        { type: 'giveClue', word: 'test', number: 1 },
        'spy',
      )
      expect(result).toBe(true)
    })

    it('should deny non-spy to give clue', () => {
      const result = canPerformAction(
        baseState as never,
        { type: 'giveClue', word: 'test', number: 1 },
        'guesser',
      )
      expect(result).toBe(false)
    })

    it('should allow guesser to highlight word when it is their turn', () => {
      const result = canPerformAction(
        baseState as never,
        { type: 'highlightWord', wordIndex: 0 },
        'guesser',
      )
      expect(result).toBe(true)
    })

    it('should deny spy to highlight word', () => {
      const result = canPerformAction(
        baseState as never,
        { type: 'highlightWord', wordIndex: 0 },
        'spy',
      )
      expect(result).toBe(false)
    })

    it('should deny highlight on already revealed word', () => {
      const stateWithRevealed = {
        ...baseState,
        currentRound: {
          ...baseState.currentRound,
          revealedWords: [{ wordIndex: 0, cardType: CardType.RED }],
        },
      }
      const result = canPerformAction(
        stateWithRevealed as never,
        { type: 'highlightWord', wordIndex: 0 },
        'guesser',
      )
      expect(result).toBe(false)
    })

    it('should allow guesser to select word', () => {
      const result = canPerformAction(
        baseState as never,
        { type: 'selectWord', wordIndex: 0 },
        'guesser',
      )
      expect(result).toBe(true)
    })

    it('should deny player not in game', () => {
      const result = canPerformAction(
        baseState as never,
        { type: 'selectWord', wordIndex: 0 },
        'unknown',
      )
      expect(result).toBe(false)
    })
  })
})
