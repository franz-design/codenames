import { EntityManager, FilterQuery } from '@mikro-orm/core'
import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { User } from '../auth/auth.entity'
import {
  ChooseSideInput,
  GamePagination,
  GameResponse,
  GameSorting,
  GamesResponse,
  GameStateResponse,
  GiveClueInput,
  HighlightWordInput,
  SelectWordInput,
  StartRoundInput,
} from './contracts/games.contract'
import { GameEvent } from './entities/game-event.entity'
import { Game } from './games.entity'
import { Round } from './entities/round.entity'
import {
  checkGameOver,
  computeGameState,
  type GameAction,
  type GameEventInput,
  generateGridResults,
  canPerformAction,
} from './game-core.logic'
import { GameEventType } from './game-event.types'
import type { CardType, Side } from './game-event.types'
import { WordsService } from '../words/words.service'
import { GamesGateway } from './games.gateway'

@Injectable()
export class GamesService {
  constructor(
    private readonly em: EntityManager,
    private readonly wordsService: WordsService,
    @Inject(forwardRef(() => GamesGateway))
    private readonly gamesGateway: GamesGateway,
  ) {}

  async createGame(userId: string): Promise<GameResponse> {
    const user = await this.em.findOne(User, { id: userId })
    if (!user)
      throw new NotFoundException('User not found')

    const game = new Game()
    game.createdBy = user
    await this.em.persistAndFlush(game)

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.eventType = GameEventType.GAME_CREATED
    gameEvent.payload = { createdById: userId }
    gameEvent.triggeredBy = userId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(game.id, userId)
    return this.mapGameToResponse(game)
  }

  async getGame(gameId: string): Promise<GameResponse> {
    const game = await this.em.findOne(Game, { id: gameId }, { populate: ['createdBy'] })
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
      populate: ['createdBy'],
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

  async getGameState(gameId: string, userId?: string): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    return this.mapStateToResponse(state)
  }

  async joinGame(gameId: string, userId: string): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const user = await this.em.findOne(User, { id: userId })
    if (!user)
      throw new NotFoundException('User not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    if (state.players.some(p => p.id === userId))
      throw new BadRequestException('Player already in game')

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.eventType = GameEventType.PLAYER_JOINED
    gameEvent.payload = { playerId: userId, playerName: user.name }
    gameEvent.triggeredBy = userId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId, userId)
    return this.getGameState(gameId, userId)
  }

  async leaveGame(gameId: string, userId: string): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    if (!state.players.some(p => p.id === userId))
      throw new BadRequestException('Player not in game')

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.eventType = GameEventType.PLAYER_LEFT
    gameEvent.payload = { playerId: userId }
    gameEvent.triggeredBy = userId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId)
    return this.getGameState(gameId)
  }

  async chooseSide(
    gameId: string,
    userId: string,
    data: ChooseSideInput,
  ): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const user = await this.em.findOne(User, { id: userId })
    if (!user)
      throw new NotFoundException('User not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    if (!state.players.some(p => p.id === userId))
      throw new BadRequestException('Player not in game')

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.eventType = GameEventType.PLAYER_CHOSE_SIDE
    gameEvent.payload = {
      playerId: userId,
      playerName: user.name,
      side: data.side,
    }
    gameEvent.triggeredBy = userId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId, userId)
    return this.getGameState(gameId, userId)
  }

  async designateSpy(gameId: string, userId: string): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const user = await this.em.findOne(User, { id: userId })
    if (!user)
      throw new NotFoundException('User not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    const player = state.players.find(p => p.id === userId)
    if (!player)
      throw new BadRequestException('Player not in game')
    if (!player.side)
      throw new BadRequestException('Player must choose a side first')

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.eventType = GameEventType.PLAYER_DESIGNATED_SPY
    gameEvent.payload = {
      playerId: userId,
      playerName: user.name,
      side: player.side,
    }
    gameEvent.triggeredBy = userId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId, userId)
    return this.getGameState(gameId, userId)
  }

  async startRound(
    gameId: string,
    userId: string,
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
    gameEvent.triggeredBy = userId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId, userId)
    return this.getGameState(gameId, userId)
  }

  async giveClue(
    gameId: string,
    userId: string,
    data: GiveClueInput,
  ): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    const action: GameAction = { type: 'giveClue', word: data.word, number: data.number }
    if (!canPerformAction(state, action, userId))
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
    gameEvent.triggeredBy = userId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId, userId)
    return this.getGameState(gameId, userId)
  }

  async selectWord(
    gameId: string,
    userId: string,
    data: SelectWordInput,
  ): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    const action: GameAction = { type: 'selectWord', wordIndex: data.wordIndex }
    if (!canPerformAction(state, action, userId))
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
    gameEvent.triggeredBy = userId
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
      finishEvent.triggeredBy = userId
      await this.em.persistAndFlush(finishEvent)
    }
    else if (cardType !== round.currentTurn || newRound.guessesRemaining <= 0) {
      const passEvent = new GameEvent()
      passEvent.game = game
      passEvent.round = roundEntity
      passEvent.eventType = GameEventType.TURN_PASSED
      passEvent.payload = {}
      passEvent.triggeredBy = userId
      await this.em.persistAndFlush(passEvent)
    }

    await this.emitGameState(gameId, userId)
    return this.getGameState(gameId, userId)
  }

  async highlightWord(
    gameId: string,
    userId: string,
    data: HighlightWordInput,
  ): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const user = await this.em.findOne(User, { id: userId })
    if (!user)
      throw new NotFoundException('User not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    const action: GameAction = { type: 'highlightWord', wordIndex: data.wordIndex }
    if (!canPerformAction(state, action, userId))
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
      playerId: userId,
      playerName: user.name,
    }
    gameEvent.triggeredBy = userId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId, userId)
    return this.getGameState(gameId, userId)
  }

  async unhighlightWord(
    gameId: string,
    userId: string,
    wordIndex: number,
  ): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    const action: GameAction = { type: 'unhighlightWord', wordIndex }
    if (!canPerformAction(state, action, userId))
      throw new ForbiddenException('Cannot unhighlight word')

    const round = state.currentRound!
    const roundEntity = await this.em.findOne(Round, { id: round.id })
    if (!roundEntity)
      throw new NotFoundException('Round not found')

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.round = roundEntity
    gameEvent.eventType = GameEventType.WORD_UNHIGHLIGHTED
    gameEvent.payload = { wordIndex, playerId: userId }
    gameEvent.triggeredBy = userId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId, userId)
    return this.getGameState(gameId, userId)
  }

  async passTurn(gameId: string, userId: string): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    const action: GameAction = { type: 'passTurn' }
    if (!canPerformAction(state, action, userId))
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
    gameEvent.triggeredBy = userId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId, userId)
    return this.getGameState(gameId, userId)
  }

  async restartGame(gameId: string, userId: string): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.eventType = GameEventType.GAME_RESTARTED
    gameEvent.payload = {}
    gameEvent.triggeredBy = userId
    await this.em.persistAndFlush(gameEvent)

    await this.emitGameState(gameId, userId)
    return this.getGameState(gameId, userId)
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
      createdBy: {
        id: game.createdBy.id,
        name: game.createdBy.name,
        email: game.createdBy.email,
      },
      createdAt: game.createdAt,
    }
  }

  private async emitGameState(gameId: string, userId?: string): Promise<void> {
    try {
      const state = await this.getGameState(gameId, userId)
      this.gamesGateway.broadcastGameState(gameId, state)
    }
    catch {
      // Ignore emit errors (e.g. no clients in room)
    }
  }

  private mapStateToResponse(state: ReturnType<typeof computeGameState>): GameStateResponse {
    const highlights: Record<string, { playerId: string; playerName: string }[]> = {}
    if (state.currentRound) {
      for (const [key, value] of Object.entries(state.currentRound.highlights)) {
        highlights[String(key)] = value
      }
    }

    return {
      status: state.status,
      players: state.players.map(p => ({
        id: p.id,
        name: p.name,
        side: p.side ?? null,
        isSpy: p.isSpy,
      })),
      currentRound: state.currentRound
        ? {
            ...state.currentRound,
            currentClue: state.currentRound.currentClue ?? null,
            highlights,
          }
        : null,
      winningSide: state.winningSide ?? null,
      losingSide: state.losingSide ?? null,
    }
  }
}
