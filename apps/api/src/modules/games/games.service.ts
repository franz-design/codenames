import type { GameAction, GameEventInput } from './game-core.logic'
import type { CardType, Side } from './game-event.types'
import { randomUUID } from 'node:crypto'
import { EntityManager } from '@mikro-orm/core'
import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { subHours } from 'date-fns'
import { WordsService } from '../words/words.service'
import {
  AssignPlayerSideByCreatorInput,
  ChooseSideInput,
  CreateGameResponse,
  GameResponse,
  GameStateResponse,
  GiveClueInput,
  HighlightWordInput,
  JoinGameResponse,
  SelectWordInput,
  SendChatInput,
  SetTimerSettingsInput,
  StartRoundInput,
  TimelineItemResponse,
  TimelinePagination,
  TimelineResponse,
} from './contracts/games.contract'
import { GameEvent } from './entities/game-event.entity'
import { Round } from './entities/round.entity'
import {
  canPerformAction,
  checkGameOver,
  computeGameState,

  computeWordsRemainingBySide,
  computeWordsTotalBySide,
  generateGridResults,
} from './game-core.logic'
import { GameEventType } from './game-event.types'
import { Game } from './games.entity'
import { GamesGateway } from './games.gateway'

const STALE_UNFINISHED_GAME_MAX_AGE_HOURS = 24

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name)
  private readonly adminSpectatorPlayerIds = new Set<string>()
  private readonly turnTimerHandles = new Map<string, ReturnType<typeof setTimeout>>()

  constructor(
    private readonly em: EntityManager,
    private readonly wordsService: WordsService,
    // eslint-disable-next-line react/no-forward-ref, react/no-useless-forward-ref
    @Inject(forwardRef(() => GamesGateway))
    private readonly gamesGateway: GamesGateway,
  ) {}

  isAdminSpectatorPlayer(playerId: string): boolean {
    return this.adminSpectatorPlayerIds.has(playerId)
  }

  registerAdminSpectator(): string {
    const playerId = randomUUID()
    this.adminSpectatorPlayerIds.add(playerId)
    return playerId
  }

  unregisterAdminSpectatorIfExists(playerId: string): void {
    this.adminSpectatorPlayerIds.delete(playerId)
  }

  unregisterAdminSpectatorOrThrow(playerId: string): void {
    if (!this.adminSpectatorPlayerIds.has(playerId))
      throw new ForbiddenException('Invalid spectator session')
    this.adminSpectatorPlayerIds.delete(playerId)
  }

  /**
   * Closes unfinished games whose `Game.createdAt` is older than 24 hours by appending `GAME_FINISHED`.
   * Intended for the daily cron job.
   */
  async expireStaleUnfinishedGames(): Promise<number> {
    const cutoff = subHours(new Date(), STALE_UNFINISHED_GAME_MAX_AGE_HOURS)
    const games = await this.em.find(Game, { createdAt: { $lt: cutoff } })
    let closed = 0
    for (const game of games) {
      try {
        const events = await this.loadGameEvents(game.id)
        const state = computeGameState(events)
        if (state.status === 'FINISHED')
          continue

        const finishEvent = new GameEvent()
        finishEvent.game = game
        finishEvent.eventType = GameEventType.GAME_FINISHED
        if (state.currentRound) {
          const roundEntity = await this.em.findOne(Round, { id: state.currentRound.id })
          if (roundEntity)
            finishEvent.round = roundEntity
        }
        finishEvent.payload = { reason: 'STALE_SESSION' }
        finishEvent.triggeredBy = null
        await this.em.persistAndFlush(finishEvent)
        await this.emitTimelineItem(game.id, finishEvent)

        const eventsAfter = await this.loadGameEvents(game.id)
        const stateAfter = computeGameState(eventsAfter)
        await this.emitGameState(game.id, stateAfter)
        closed++
      }
      catch (err) {
        this.logger.warn(
          `expireStaleUnfinishedGames: failed for game ${game.id}: ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    }
    return closed
  }

  async listOngoingGamesForAdmin(): Promise<
    { id: string, status: 'LOBBY' | 'PLAYING' | 'FINISHED', creatorPseudo: string, createdAt: string }[]
  > {
    const games = await this.em.find(Game, {}, { orderBy: { createdAt: 'DESC' }, limit: 150 })
    const ongoing: { id: string, status: 'LOBBY' | 'PLAYING' | 'FINISHED', creatorPseudo: string, createdAt: string }[] = []
    for (const game of games) {
      const events = await this.loadGameEvents(game.id)
      const state = computeGameState(events)
      if (state.status === 'FINISHED')
        continue
      ongoing.push({
        id: game.id,
        status: state.status,
        creatorPseudo: game.creatorPseudo,
        createdAt: game.createdAt.toISOString(),
      })
    }
    return ongoing
  }

  private assertPlayerCanMutate(playerId: string): void {
    if (this.isAdminSpectatorPlayer(playerId)) {
      throw new ForbiddenException('Spectator session cannot modify the game')
    }
  }

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
    await this.emitTimelineItem(game.id, gameEvent)

    const joinEvent = new GameEvent()
    joinEvent.game = game
    joinEvent.eventType = GameEventType.PLAYER_JOINED
    joinEvent.payload = { playerId, playerName: pseudo.trim() }
    joinEvent.triggeredBy = playerId
    await this.em.persistAndFlush(joinEvent)
    await this.emitTimelineItem(game.id, joinEvent)

    const eventsAfterCreate = await this.loadGameEvents(game.id)
    const stateAfterCreate = computeGameState(eventsAfterCreate)
    await this.emitGameState(game.id, stateAfterCreate)
    const gameState = this.buildGameStateResponseFromComputed(stateAfterCreate, playerId)
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

  async getGameState(gameId: string, playerId?: string): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)
    return this.buildGameStateResponseFromComputed(state, playerId)
  }

  private buildGameStateResponseFromComputed(
    state: ReturnType<typeof computeGameState>,
    playerId?: string,
  ): GameStateResponse {
    const excludeResults = this.shouldExcludeResultsForPlayer(state, playerId)
    return this.mapStateToResponse(state, excludeResults)
  }

  private shouldExcludeResultsForPlayer(
    state: ReturnType<typeof computeGameState>,
    playerId?: string,
  ): boolean {
    if (playerId && this.isAdminSpectatorPlayer(playerId))
      return false
    if (!playerId)
      return true
    if (state.status === 'FINISHED')
      return false
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

    const eventsAfterJoin = await this.loadGameEvents(gameId)
    const stateAfterJoin = computeGameState(eventsAfterJoin)
    await this.emitGameState(gameId, stateAfterJoin)
    const gameState = this.buildGameStateResponseFromComputed(stateAfterJoin, playerId)
    return { gameState, playerId }
  }

  async kickPlayer(
    gameId: string,
    playerIdToKick: string,
  ): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

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
    await this.emitTimelineItem(gameId, gameEvent)

    const eventsAfterKick = await this.loadGameEvents(gameId)
    const stateAfterKick = computeGameState(eventsAfterKick)
    await this.emitGameState(gameId, stateAfterKick)
    return this.buildGameStateResponseFromComputed(stateAfterKick, undefined)
  }

  async leaveGame(gameId: string, playerId: string): Promise<GameStateResponse> {
    this.assertPlayerCanMutate(playerId)

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
    await this.emitTimelineItem(gameId, gameEvent)

    const eventsAfterLeave = await this.loadGameEvents(gameId)
    const stateAfterLeave = computeGameState(eventsAfterLeave)
    await this.emitGameState(gameId, stateAfterLeave)
    return this.buildGameStateResponseFromComputed(stateAfterLeave, playerId)
  }

  async chooseSide(
    gameId: string,
    playerId: string,
    data: ChooseSideInput,
  ): Promise<GameStateResponse> {
    this.assertPlayerCanMutate(playerId)

    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    const player = state.players.find(p => p.id === playerId)
    if (!player)
      throw new BadRequestException('Player not in game')

    if (state.status !== 'LOBBY')
      throw new BadRequestException('Team choice is only available in the lobby')

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
    await this.emitTimelineItem(gameId, gameEvent)

    const eventsAfterChooseSide = await this.loadGameEvents(gameId)
    const stateAfterChooseSide = computeGameState(eventsAfterChooseSide)
    await this.emitGameState(gameId, stateAfterChooseSide)
    return this.buildGameStateResponseFromComputed(stateAfterChooseSide, playerId)
  }

  async assignPlayerSideByCreator(
    gameId: string,
    targetPlayerId: string,
    data: AssignPlayerSideByCreatorInput,
  ): Promise<GameStateResponse> {
    const { side } = data
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    if (state.status !== 'PLAYING')
      throw new BadRequestException('Players can only be assigned by the host while a round is in progress')

    const player = state.players.find(p => p.id === targetPlayerId)
    if (!player)
      throw new BadRequestException('Player not in game')
    if (player.side)
      throw new BadRequestException('Player already has a team')

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.eventType = GameEventType.PLAYER_CHOSE_SIDE
    gameEvent.payload = {
      playerId: targetPlayerId,
      playerName: player.name,
      side,
    }
    gameEvent.triggeredBy = targetPlayerId
    await this.em.persistAndFlush(gameEvent)
    await this.emitTimelineItem(gameId, gameEvent)

    const eventsAfter = await this.loadGameEvents(gameId)
    const stateAfter = computeGameState(eventsAfter)
    await this.emitGameState(gameId, stateAfter)
    return this.buildGameStateResponseFromComputed(stateAfter, undefined)
  }

  async designateSpy(gameId: string, playerId: string): Promise<GameStateResponse> {
    this.assertPlayerCanMutate(playerId)

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
    await this.emitTimelineItem(gameId, gameEvent)

    const eventsAfterDesignateSpy = await this.loadGameEvents(gameId)
    const stateAfterDesignateSpy = computeGameState(eventsAfterDesignateSpy)
    await this.emitGameState(gameId, stateAfterDesignateSpy)
    return this.buildGameStateResponseFromComputed(stateAfterDesignateSpy, playerId)
  }

  async designatePlayerAsSpy(
    gameId: string,
    targetPlayerId: string,
  ): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

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
    await this.emitTimelineItem(gameId, gameEvent)

    const eventsAfterDesignateTarget = await this.loadGameEvents(gameId)
    const stateAfterDesignateTarget = computeGameState(eventsAfterDesignateTarget)
    await this.emitGameState(gameId, stateAfterDesignateTarget)
    return this.buildGameStateResponseFromComputed(stateAfterDesignateTarget, undefined)
  }

  async setTimerSettings(
    gameId: string,
    data: SetTimerSettingsInput,
  ): Promise<GameStateResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    if (state.status !== 'LOBBY')
      throw new BadRequestException('Timer settings can only be changed in the lobby')

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.eventType = GameEventType.GAME_TIMER_SETTINGS
    gameEvent.payload = {
      isEnabled: data.isEnabled,
      durationSeconds: data.durationSeconds,
    }
    gameEvent.triggeredBy = null
    await this.em.persistAndFlush(gameEvent)
    await this.emitTimelineItem(gameId, gameEvent)

    const eventsAfter = await this.loadGameEvents(gameId)
    const stateAfter = computeGameState(eventsAfter)
    await this.emitGameState(gameId, stateAfter)
    return this.buildGameStateResponseFromComputed(stateAfter, undefined)
  }

  async startRound(
    gameId: string,
    playerId: string,
    data?: StartRoundInput,
  ): Promise<GameStateResponse> {
    this.assertPlayerCanMutate(playerId)

    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    let events = await this.loadGameEvents(gameId)
    let state = computeGameState(events)

    if (state.status === 'PLAYING')
      throw new BadRequestException('Round already in progress')

    if (data?.timerSettings) {
      if (state.status !== 'LOBBY')
        throw new BadRequestException('Timer settings can only be applied from the lobby')
      if (game.creatorToken !== data.timerSettings.creatorToken)
        throw new ForbiddenException('Only the game creator can set timer settings')

      const timerEvent = new GameEvent()
      timerEvent.game = game
      timerEvent.eventType = GameEventType.GAME_TIMER_SETTINGS
      timerEvent.payload = {
        isEnabled: data.timerSettings.isEnabled,
        durationSeconds: data.timerSettings.durationSeconds,
      }
      timerEvent.triggeredBy = null
      await this.em.persistAndFlush(timerEvent)
      await this.emitTimelineItem(gameId, timerEvent)

      events = await this.loadGameEvents(gameId)
      state = computeGameState(events)
    }

    const wordCount = data?.wordCount ?? 25
    const wordsResult = await this.wordsService.getRandomWords({ count: wordCount })
    const words = wordsResult.map(w => w.label)
    const order = state.currentRound ? state.currentRound.order + 1 : 1
    const results = generateGridResults(order)
    const startingSide: Side = order % 2 === 0 ? 'blue' : 'red'
    const timerSettings = state.timerSettings
    const turnStartedAt
      = timerSettings?.isEnabled === true ? new Date().toISOString() : null

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
      turnStartedAt,
    }
    gameEvent.triggeredBy = playerId
    await this.em.persistAndFlush(gameEvent)
    await this.emitTimelineItem(gameId, gameEvent)

    const eventsAfterStartRound = await this.loadGameEvents(gameId)
    const stateAfterStartRound = computeGameState(eventsAfterStartRound)
    await this.emitGameState(gameId, stateAfterStartRound)
    this.syncTurnTimer(gameId)
    return this.buildGameStateResponseFromComputed(stateAfterStartRound, playerId)
  }

  async giveClue(
    gameId: string,
    playerId: string,
    data: GiveClueInput,
  ): Promise<GameStateResponse> {
    this.assertPlayerCanMutate(playerId)

    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    await this.enforceTurnTimerIfExpired(gameId)

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
    const player = state.players.find(p => p.id === playerId)!
    gameEvent.eventType = GameEventType.CLUE_GIVEN
    gameEvent.payload = { word: data.word, number: data.number, playerName: player.name }
    gameEvent.triggeredBy = playerId
    await this.em.persistAndFlush(gameEvent)
    await this.emitTimelineItem(gameId, gameEvent)

    const eventsAfterClue = await this.loadGameEvents(gameId)
    const stateAfterClue = computeGameState(eventsAfterClue)
    await this.emitGameState(gameId, stateAfterClue)
    return this.buildGameStateResponseFromComputed(stateAfterClue, playerId)
  }

  async selectWord(
    gameId: string,
    playerId: string,
    data: SelectWordInput,
  ): Promise<GameStateResponse> {
    this.assertPlayerCanMutate(playerId)

    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    await this.enforceTurnTimerIfExpired(gameId)

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

    const player = state.players.find(p => p.id === playerId)!
    const word = round.words[data.wordIndex]
    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.round = roundEntity
    gameEvent.eventType = GameEventType.WORD_SELECTED
    gameEvent.payload = { wordIndex: data.wordIndex, cardType, word, playerName: player.name }
    gameEvent.triggeredBy = playerId
    await this.em.persistAndFlush(gameEvent)
    await this.emitTimelineItem(gameId, gameEvent)

    const newEvents = await this.loadGameEvents(gameId)
    const newState = computeGameState(newEvents)
    const newRound = newState.currentRound!
    const gameOver = checkGameOver(
      newRound.revealedWords,
      newRound.results,
      newRound.currentTurn,
    )

    let didPassTurn = false
    if (gameOver.isOver) {
      const finishEvent = new GameEvent()
      finishEvent.game = game
      finishEvent.round = roundEntity
      finishEvent.eventType = GameEventType.GAME_FINISHED
      finishEvent.payload = {
        winningSide: gameOver.winningSide ?? undefined,
        losingSide: gameOver.losingSide ?? undefined,
        words: newRound.words,
        results: newRound.results,
      }
      finishEvent.triggeredBy = playerId
      await this.em.persistAndFlush(finishEvent)
      await this.emitTimelineItem(gameId, finishEvent)
    }
    else if (cardType !== round.currentTurn || newRound.guessesRemaining <= 0) {
      await this.persistTurnPassed(gameId, game, roundEntity, newState, playerId, undefined)
      didPassTurn = true
    }

    const eventsFinal = await this.loadGameEvents(gameId)
    const stateFinal = computeGameState(eventsFinal)
    await this.emitGameState(gameId, stateFinal)
    if (gameOver.isOver || didPassTurn)
      this.syncTurnTimer(gameId)
    return this.buildGameStateResponseFromComputed(stateFinal, playerId)
  }

  async highlightWord(
    gameId: string,
    playerId: string,
    data: HighlightWordInput,
  ): Promise<GameStateResponse> {
    this.assertPlayerCanMutate(playerId)

    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    await this.enforceTurnTimerIfExpired(gameId)

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
    const word = round.words[data.wordIndex]
    gameEvent.payload = {
      wordIndex: data.wordIndex,
      playerId,
      playerName: player.name,
      word,
    }
    gameEvent.triggeredBy = playerId
    await this.em.persistAndFlush(gameEvent)
    await this.emitTimelineItem(gameId, gameEvent)

    const eventsAfterHighlight = await this.loadGameEvents(gameId)
    const stateAfterHighlight = computeGameState(eventsAfterHighlight)
    await this.emitGameState(gameId, stateAfterHighlight)
    return this.buildGameStateResponseFromComputed(stateAfterHighlight, playerId)
  }

  async unhighlightWord(
    gameId: string,
    playerId: string,
    wordIndex: number,
  ): Promise<GameStateResponse> {
    this.assertPlayerCanMutate(playerId)

    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    await this.enforceTurnTimerIfExpired(gameId)

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
    const word = round.words[wordIndex]
    const player = state.players.find(p => p.id === playerId)!
    gameEvent.eventType = GameEventType.WORD_UNHIGHLIGHTED
    gameEvent.payload = { wordIndex, playerId, word, playerName: player.name }
    gameEvent.triggeredBy = playerId
    await this.em.persistAndFlush(gameEvent)
    await this.emitTimelineItem(gameId, gameEvent)

    const eventsAfterUnhighlight = await this.loadGameEvents(gameId)
    const stateAfterUnhighlight = computeGameState(eventsAfterUnhighlight)
    await this.emitGameState(gameId, stateAfterUnhighlight)
    return this.buildGameStateResponseFromComputed(stateAfterUnhighlight, playerId)
  }

  async passTurn(gameId: string, playerId: string): Promise<GameStateResponse> {
    this.assertPlayerCanMutate(playerId)

    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    await this.enforceTurnTimerIfExpired(gameId)

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    const action: GameAction = { type: 'passTurn' }
    if (!canPerformAction(state, action, playerId))
      throw new ForbiddenException('Cannot pass turn')

    const round = state.currentRound!
    const roundEntity = await this.em.findOne(Round, { id: round.id })
    if (!roundEntity)
      throw new NotFoundException('Round not found')

    await this.persistTurnPassed(gameId, game, roundEntity, state, playerId, undefined)

    const eventsAfterPass = await this.loadGameEvents(gameId)
    const stateAfterPass = computeGameState(eventsAfterPass)
    await this.emitGameState(gameId, stateAfterPass)
    this.syncTurnTimer(gameId)
    return this.buildGameStateResponseFromComputed(stateAfterPass, playerId)
  }

  async restartGame(gameId: string, playerId: string): Promise<GameStateResponse> {
    this.assertPlayerCanMutate(playerId)

    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    this.cancelTurnTimer(gameId)

    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.eventType = GameEventType.GAME_RESTARTED
    gameEvent.payload = {}
    gameEvent.triggeredBy = playerId
    await this.em.persistAndFlush(gameEvent)
    await this.emitTimelineItem(gameId, gameEvent)

    const eventsAfterRestart = await this.loadGameEvents(gameId)
    const stateAfterRestart = computeGameState(eventsAfterRestart)
    await this.emitGameState(gameId, stateAfterRestart)
    return this.buildGameStateResponseFromComputed(stateAfterRestart, playerId)
  }

  async sendChatMessage(
    gameId: string,
    playerId: string,
    data: SendChatInput,
  ): Promise<void> {
    this.assertPlayerCanMutate(playerId)

    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)

    const player = state.players.find(p => p.id === playerId)
    if (!player)
      throw new BadRequestException('Player not in game')

    if (state.status === 'PLAYING' && !player.side) {
      throw new ForbiddenException(
        'Cannot send chat until the host assigns you to a team',
      )
    }

    const content = data.content.trim()
    if (!content)
      throw new BadRequestException('Chat message cannot be empty')

    const gameEvent = new GameEvent()
    gameEvent.game = game
    if (state.currentRound) {
      const roundEntity = await this.em.findOne(Round, { id: state.currentRound.id })
      if (roundEntity)
        gameEvent.round = roundEntity
    }
    gameEvent.eventType = GameEventType.CHAT_MESSAGE
    gameEvent.payload = {
      playerId,
      playerName: player.name,
      content,
      ...(player.side ? { side: player.side } : {}),
    }
    gameEvent.triggeredBy = playerId
    await this.em.persistAndFlush(gameEvent)

    await this.emitTimelineItem(gameId, gameEvent)
  }

  async getTimeline(
    gameId: string,
    pagination: TimelinePagination & { roundId?: string },
  ): Promise<TimelineResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const filter: { game: string, round?: { id: string } } = { game: gameId }
    if (pagination.roundId) {
      filter.round = { id: pagination.roundId }
    }
    else {
      return {
        data: [],
        meta: {
          itemCount: 0,
          pageSize: pagination.pageSize,
          offset: pagination.offset,
          hasMore: false,
        },
      }
    }

    const [events, total] = await this.em.findAndCount(
      GameEvent,
      filter,
      {
        orderBy: { createdAt: 'ASC' },
        populate: ['round'],
        limit: pagination.pageSize,
        offset: pagination.offset,
      },
    )

    const data: TimelineItemResponse[] = events.map(e => this.mapEventToTimelineItem(e))

    return {
      data,
      meta: {
        itemCount: data.length,
        pageSize: pagination.pageSize,
        offset: pagination.offset,
        hasMore: pagination.offset + data.length < total,
      },
    }
  }

  private mapEventToTimelineItem(event: GameEvent): TimelineItemResponse {
    const type = event.eventType === GameEventType.CHAT_MESSAGE ? 'chat' : 'event'
    const payload = event.payload as Record<string, unknown>

    return {
      id: event.id,
      type,
      eventType: type === 'event' ? event.eventType : undefined,
      payload,
      triggeredBy: event.triggeredBy ?? null,
      playerName: payload.playerName as string | undefined,
      createdAt: event.createdAt.toISOString(),
      roundId: event.round?.id ?? null,
    }
  }

  private async emitTimelineItem(gameId: string, event: GameEvent): Promise<void> {
    try {
      const item = this.mapEventToTimelineItem(event)
      await this.gamesGateway.broadcastTimelineItem(gameId, item)
    }
    catch {
      // Ignore emit errors
    }
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

  private buildTurnPassedPayload(
    round: { currentTurn: Side },
    timerSettings: { isEnabled: boolean, durationSeconds: number } | null | undefined,
    reason?: 'TIMER',
  ): Record<string, unknown> {
    const nextTurn: Side = round.currentTurn === 'red' ? 'blue' : 'red'
    const payload: Record<string, unknown> = { nextTurn }
    if (timerSettings?.isEnabled)
      payload.nextTurnStartedAt = new Date().toISOString()
    if (reason)
      payload.reason = reason
    return payload
  }

  private async persistTurnPassed(
    gameId: string,
    game: Game,
    roundEntity: Round,
    stateBeforePass: ReturnType<typeof computeGameState>,
    triggeredBy: string | null,
    reason?: 'TIMER',
  ): Promise<void> {
    const round = stateBeforePass.currentRound!
    const payload = this.buildTurnPassedPayload(round, stateBeforePass.timerSettings, reason)
    const gameEvent = new GameEvent()
    gameEvent.game = game
    gameEvent.round = roundEntity
    gameEvent.eventType = GameEventType.TURN_PASSED
    gameEvent.payload = payload
    gameEvent.triggeredBy = triggeredBy
    await this.em.persistAndFlush(gameEvent)
    await this.emitTimelineItem(gameId, gameEvent)
  }

  private cancelTurnTimer(gameId: string): void {
    const handle = this.turnTimerHandles.get(gameId)
    if (handle !== undefined) {
      clearTimeout(handle)
      this.turnTimerHandles.delete(gameId)
    }
  }

  private syncTurnTimer(gameId: string): void {
    this.cancelTurnTimer(gameId)
    void this.scheduleTurnTimer(gameId)
  }

  private async scheduleTurnTimer(gameId: string): Promise<void> {
    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)
    if (state.status !== 'PLAYING' || !state.currentRound?.turnStartedAt || !state.timerSettings?.isEnabled)
      return
    const deadlineMs = new Date(state.currentRound.turnStartedAt).getTime() + state.timerSettings.durationSeconds * 1000
    const delay = Math.max(0, deadlineMs - Date.now())
    const expectedAt = state.currentRound.turnStartedAt
    const handle = setTimeout(() => {
      void this.handleTurnTimerElapsed(gameId, expectedAt)
    }, delay)
    this.turnTimerHandles.set(gameId, handle)
  }

  private async handleTurnTimerElapsed(
    gameId: string,
    expectedTurnStartedAt: string | null,
  ): Promise<void> {
    this.turnTimerHandles.delete(gameId)
    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)
    if (state.status !== 'PLAYING' || !state.currentRound)
      return
    if (state.currentRound.turnStartedAt !== expectedTurnStartedAt)
      return
    await this.enforceTurnTimerIfExpired(gameId)
  }

  private async enforceTurnTimerIfExpired(gameId: string): Promise<void> {
    const events = await this.loadGameEvents(gameId)
    const state = computeGameState(events)
    if (state.status !== 'PLAYING' || !state.currentRound)
      return
    const ts = state.timerSettings
    const started = state.currentRound.turnStartedAt
    if (!ts?.isEnabled || !started)
      return
    const deadlineMs = new Date(started).getTime() + ts.durationSeconds * 1000
    if (Date.now() < deadlineMs)
      return

    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      return
    const roundEntity = await this.em.findOne(Round, { id: state.currentRound.id })
    if (!roundEntity)
      return
    await this.persistTurnPassed(gameId, game, roundEntity, state, null, 'TIMER')
    const eventsAfter = await this.loadGameEvents(gameId)
    const stateAfter = computeGameState(eventsAfter)
    await this.emitGameState(gameId, stateAfter)
    this.syncTurnTimer(gameId)
  }

  private mapGameToResponse(game: Game): GameResponse {
    return {
      id: game.id,
      creatorPseudo: game.creatorPseudo,
      createdAt: game.createdAt,
    }
  }

  private async emitGameState(
    gameId: string,
    state: ReturnType<typeof computeGameState>,
  ): Promise<void> {
    try {
      const withResults = this.mapStateToResponse(state, false)
      const withoutResults = this.mapStateToResponse(state, true)
      await this.gamesGateway.broadcastGameState(gameId, (playerId) => {
        if (state.status === 'FINISHED')
          return withResults
        if (playerId && this.isAdminSpectatorPlayer(playerId))
          return withResults
        return this.shouldExcludeResultsForPlayer(state, playerId)
          ? withoutResults
          : withResults
      })
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
          const wordsTotalBySide = computeWordsTotalBySide(_results)
          const wordsRemainingBySide = computeWordsRemainingBySide(
            _results,
            state.currentRound.revealedWords,
          )
          return {
            ...rest,
            currentClue: state.currentRound.currentClue ?? null,
            highlights,
            wordsTotalBySide,
            wordsRemainingBySide,
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
      timerSettings: state.timerSettings ?? null,
    }
  }
}
