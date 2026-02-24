import type { GameAction, GameEventInput } from './game-core.logic'
import type { CardType, Side } from './game-event.types'
import { randomUUID } from 'node:crypto'
import { EntityManager, FilterQuery } from '@mikro-orm/core'
import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { WordsService } from '../words/words.service'
import {
  ChooseSideInput,
  CreateGameResponse,
  GamePagination,
  GameResponse,
  GameSorting,
  GamesResponse,
  GameStateResponse,
  GiveClueInput,
  HighlightWordInput,
  JoinGameResponse,
  KickPlayerInput,
  SelectWordInput,
  StartRoundInput,
} from './contracts/games.contract'
import { GameEvent } from './entities/game-event.entity'
import { Round } from './entities/round.entity'
import {
  canPerformAction,
  checkGameOver,
  computeGameState,

  generateGridResults,
} from './game-core.logic'
import { GameEventType } from './game-event.types'
import { Game } from './games.entity'
import { GamesGateway } from './games.gateway'

@Injectable()
export class GamesService {
  constructor(
    private readonly em: EntityManager,
    private readonly wordsService: WordsService,
    @Inject(forwardRef(() => GamesGateway))
    private readonly gamesGateway: GamesGateway,
  ) {}

  async createGame(pseudo: string): Promise<CreateGameResponse> {
    const creatorToken = randomUUID()
    const playerId = randomUUID()

    const game = new Game()
    game.creatorPseudo = pseudo.trim()
    game.creatorToken = creatorToken
    await this.em.persistAndFlush(game)

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.eventType = GameEventType.GAME_CREATED
    gameEvent.payload = { creatorPseudo: pseudo.trim(), creatorToken }
    await this.em.persistAndFlush(gameEvent)

    const joinEvent = new GameEvent()
    joinEvent.game = game
    joinEvent.eventType = GameEventType.PLAYER_JOINED
    joinEvent.payload = { playerId, playerName: pseudo.trim() }
    joinEvent.triggeredBy = playerId
    await this.em.persistAndFlush(joinEvent)

    await this.emitGameState(game.id)
    const gameState = await this.getGameState(game.id, playerId)
    return {
      game: this.mapGameToResponse(game),
      creatorToken,
      playerId,
      gameState,
    }
  }

  async getGame(gameId: string): Promise<GameResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    return this.mapGameToResponse(game)
  }

  async getGames(
    pagination: GamePagination,
    sort?: GameSorting,
  ): Promise<GamesResponse> {
    const where: FilterQuery<Game> = {}
    const orderBy: Record<string, 'ASC' | 'DESC'> = { createdAt: 'DESC' }

    if (sort?.length) {
      sort.forEach((sortItem) => {
        orderBy[sortItem.property] = sortItem.direction.toUpperCase() as 'ASC' | 'DESC'
      })
    }

    const [games, total] = await this.em.findAndCount(Game, where, {
      orderBy,
      limit: pagination.pageSize,
      offset: pagination.offset,
    })

    return {
      data: games.map(game => this.mapGameToResponse(game)),
      meta: {
        itemCount: total,
        pageSize: pagination.pageSize,
        offset: pagination.offset,
        hasMore: pagination.offset + pagination.pageSize < total,
      },
    }
  }

  async getGameState(gameId: string, playerId?: string): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    const excludeResults = this.shouldExcludeResultsForPlayer(state, playerId)
    return this.mapStateToResponse(state, excludeResults)
  }

  private shouldExcludeResultsForPlayer(
    state: ReturnType<typeof computeGameState>,
    playerId?: string,
  ): boolean {
    if (!playerId)
      return true
    const player = state.players.find(p => p.id === playerId)
    if (!player)
      return true
    return !player.isSpy
  }

  async joinGame(gameId: string, pseudo: string): Promise<JoinGameResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const playerId = randomUUID()

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.eventType = GameEventType.PLAYER_JOINED
    gameEvent.payload = { playerId, playerName: pseudo.trim() }
    gameEvent.triggeredBy = playerId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId)
    const gameState = await this.getGameState(gameId, playerId)
    return { gameState, playerId }
  }

  async kickPlayer(
    gameId: string,
    playerIdToKick: string,
    input: KickPlayerInput,
  ): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    if (game.creatorToken !== input.creatorToken)
      throw new ForbiddenException('Only the game creator can kick players')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    if (!state.players.some(p => p.id === playerIdToKick))
      throw new BadRequestException('Player not in game')

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.eventType = GameEventType.PLAYER_KICKED
    gameEvent.payload = { playerId: playerIdToKick }
    gameEvent.triggeredBy = null
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId)
    return this.getGameState(gameId)
  }

  async leaveGame(gameId: string, playerId: string): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    if (!state.players.some(p => p.id === playerId))
      throw new BadRequestException('Player not in game')

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.eventType = GameEventType.PLAYER_LEFT
    gameEvent.payload = { playerId }
    gameEvent.triggeredBy = playerId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId)
    return this.getGameState(gameId, playerId)
  }

  async chooseSide(
    gameId: string,
    playerId: string,
    data: ChooseSideInput,
  ): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    const player = state.players.find(p => p.id === playerId)
    if (!player)
      throw new BadRequestException('Player not in game')

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.eventType = GameEventType.PLAYER_CHOSE_SIDE
    gameEvent.payload = {
      playerId,
      playerName: player.name,
      side: data.side,
    }
    gameEvent.triggeredBy = playerId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId)
    return this.getGameState(gameId, playerId)
  }

  async designateSpy(gameId: string, playerId: string): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    const player = state.players.find(p => p.id === playerId)
    if (!player)
      throw new BadRequestException('Player not in game')
    if (!player.side)
      throw new BadRequestException('Player must choose a side first')

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.eventType = GameEventType.PLAYER_DESIGNATED_SPY
    gameEvent.payload = {
      playerId,
      playerName: player.name,
      side: player.side,
    }
    gameEvent.triggeredBy = playerId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId)
    return this.getGameState(gameId, playerId)
  }

  async designatePlayerAsSpy(
    gameId: string,
    targetPlayerId: string,
    input: { creatorToken: string },
  ): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')
    if (game.creatorToken !== input.creatorToken)
      throw new ForbiddenException('Only the game creator can designate spies')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    const player = state.players.find(p => p.id === targetPlayerId)
    if (!player)
      throw new BadRequestException('Player not in game')
    if (!player.side)
      throw new BadRequestException('Player must choose a side first')

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.eventType = GameEventType.PLAYER_DESIGNATED_SPY
    gameEvent.payload = {
      playerId: targetPlayerId,
      playerName: player.name,
      side: player.side,
    }
    gameEvent.triggeredBy = targetPlayerId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId)
    return this.getGameState(gameId)
  }

  async startRound(
    gameId: string,
    playerId: string,
    data?: StartRoundInput,
  ): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    if (state.status === 'PLAYING')
      throw new BadRequestException('Round already in progress')

    const wordCount = data?.wordCount ?? 25
    const wordsResult = await this.wordsService.getRandomWords({ count: wordCount })
    const words = wordsResult.map(w => w.label)
    const order = state.currentRound ? state.currentRound.order + 1 : 1
    const results = generateGridResults(order)
    const startingSide: Side = order % 2 === 0 ? 'blue' : 'red'

    const round = new Round()
    round.game = game
    round.order = order
    round.words = words
    round.results = results
    await this.em.persistAndFlush(round)

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.round = round
    gameEvent.eventType = GameEventType.ROUND_STARTED
    gameEvent.payload = {
      words,
      results,
      order,
      startingSide,
    }
    gameEvent.triggeredBy = playerId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId)
    return this.getGameState(gameId, playerId)
  }

  async giveClue(
    gameId: string,
    playerId: string,
    data: GiveClueInput,
  ): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    const action: GameAction = { type: 'giveClue', word: data.word, number: data.number }
    if (!canPerformAction(state, action, playerId))
      throw new ForbiddenException('Cannot give clue')

    const round = state.currentRound!
    const roundEntity = await this.em.findOne(Round, { id: round.id })
    if (!roundEntity)
      throw new NotFoundException('Round not found')

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.round = roundEntity
    gameEvent.eventType = GameEventType.CLUE_GIVEN
    gameEvent.payload = { word: data.word, number: data.number }
    gameEvent.triggeredBy = playerId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId)
    return this.getGameState(gameId, playerId)
  }

  async selectWord(
    gameId: string,
    playerId: string,
    data: SelectWordInput,
  ): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    const action: GameAction = { type: 'selectWord', wordIndex: data.wordIndex }
    if (!canPerformAction(state, action, playerId))
      throw new ForbiddenException('Cannot select word')

    const round = state.currentRound!
    const cardType = round.results[data.wordIndex] as CardType
    const roundEntity = await this.em.findOne(Round, { id: round.id })
    if (!roundEntity)
      throw new NotFoundException('Round not found')

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.round = roundEntity
    gameEvent.eventType = GameEventType.WORD_SELECTED
    gameEvent.payload = { wordIndex: data.wordIndex, cardType }
    gameEvent.triggeredBy = playerId
    await this.em.persistAndFlush(gameEvent)

    const newEvents = await this.loadGameEvents(gameId)
    const newState = computeGameState(newEvents)
    const newRound = newState.currentRound!
    const gameOver = checkGameOver(
      newRound.revealedWords,
      newRound.results,
      newRound.currentTurn,
    )

    if (gameOver.isOver) {
      const finishEvent = new GameEvent()
      finishEvent.game = game
      finishEvent.round = roundEntity
      finishEvent.eventType = GameEventType.GAME_FINISHED
      finishEvent.payload = {
        winningSide: gameOver.winningSide ?? undefined,
        losingSide: gameOver.losingSide ?? undefined,
      }
      finishEvent.triggeredBy = playerId
      await this.em.persistAndFlush(finishEvent)
    }
    else if (cardType !== round.currentTurn || newRound.guessesRemaining <= 0) {
      const passEvent = new GameEvent()
      passEvent.game = game
      passEvent.round = roundEntity
      passEvent.eventType = GameEventType.TURN_PASSED
      passEvent.payload = {}
      passEvent.triggeredBy = playerId
      await this.em.persistAndFlush(passEvent)
    }

    await this.emitGameState(gameId)
    return this.getGameState(gameId, playerId)
  }

  async highlightWord(
    gameId: string,
    playerId: string,
    data: HighlightWordInput,
  ): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    const player = state.players.find(p => p.id === playerId)
    if (!player)
      throw new BadRequestException('Player not in game')

    const action: GameAction = { type: 'highlightWord', wordIndex: data.wordIndex }
    if (!canPerformAction(state, action, playerId))
      throw new ForbiddenException('Cannot highlight word')

    const round = state.currentRound!
    const roundEntity = await this.em.findOne(Round, { id: round.id })
    if (!roundEntity)
      throw new NotFoundException('Round not found')

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.round = roundEntity
    gameEvent.eventType = GameEventType.WORD_HIGHLIGHTED
    gameEvent.payload = {
      wordIndex: data.wordIndex,
      playerId,
      playerName: player.name,
    }
    gameEvent.triggeredBy = playerId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId)
    return this.getGameState(gameId, playerId)
  }

  async unhighlightWord(
    gameId: string,
    playerId: string,
    wordIndex: number,
  ): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    const action: GameAction = { type: 'unhighlightWord', wordIndex }
    if (!canPerformAction(state, action, playerId))
      throw new ForbiddenException('Cannot unhighlight word')

    const round = state.currentRound!
    const roundEntity = await this.em.findOne(Round, { id: round.id })
    if (!roundEntity)
      throw new NotFoundException('Round not found')

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.round = roundEntity
    gameEvent.eventType = GameEventType.WORD_UNHIGHLIGHTED
    gameEvent.payload = { wordIndex, playerId }
    gameEvent.triggeredBy = playerId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId)
    return this.getGameState(gameId, playerId)
  }

  async passTurn(gameId: string, playerId: string): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    const action: GameAction = { type: 'passTurn' }
    if (!canPerformAction(state, action, playerId))
      throw new ForbiddenException('Cannot pass turn')

    const round = state.currentRound!
    const roundEntity = await this.em.findOne(Round, { id: round.id })
    if (!roundEntity)
      throw new NotFoundException('Round not found')

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.round = roundEntity
    gameEvent.eventType = GameEventType.TURN_PASSED
    gameEvent.payload = {}
    gameEvent.triggeredBy = playerId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId)
    return this.getGameState(gameId, playerId)
  }

  async restartGame(gameId: string, playerId: string): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.eventType = GameEventType.GAME_RESTARTED
    gameEvent.payload = {}
    gameEvent.triggeredBy = playerId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId)
    return this.getGameState(gameId, playerId)
  }

  private async loadGameEvents(gameId: string): Promise<GameEventInput[]> {
    const events = await this.em.find(
      GameEvent,
      { game: gameId },
      { orderBy: { createdAt: 'ASC' }, populate: ['round'] },
    )

    return events.map(e => ({
      id: e.id,
      gameId: e.game.id,
      roundId: e.round?.id ?? null,
      eventType: e.eventType,
      payload: e.payload as Record<string, unknown>,
      triggeredBy: e.triggeredBy ?? null,
      createdAt: e.createdAt,
    }))
  }

  private mapGameToResponse(game: Game): GameResponse {
    return {
      id: game.id,
      creatorPseudo: game.creatorPseudo,
      createdAt: game.createdAt,
    }
  }

  private async emitGameState(gameId: string): Promise<void> {
    try {
      await this.gamesGateway.broadcastGameState(gameId)
    }
    catch {
      // Ignore emit errors (e.g. no clients in room)
    }
  }

  private mapStateToResponse(
    state: ReturnType<typeof computeGameState>,
    excludeResults: boolean,
  ): GameStateResponse {
    const highlights: Record<string, { playerId: string, playerName: string }[]> = {}
    if (state.currentRound) {
      for (const [key, value] of Object.entries(state.currentRound.highlights)) {
        highlights[String(key)] = value
      }
    }

    const currentRound = state.currentRound
      ? (() => {
          const { results: _results, ...rest } = state.currentRound
          return {
            ...rest,
            currentClue: state.currentRound.currentClue ?? null,
            highlights,
            ...(excludeResults ? {} : { results: _results }),
          }
        })()
      : null

    return {
      status: state.status,
      players: state.players.map(p => ({
        id: p.id,
        name: p.name,
        side: p.side ?? null,
        isSpy: p.isSpy,
      })),
      currentRound,
      winningSide: state.winningSide ?? null,
      losingSide: state.losingSide ?? null,
    }
  }
}
