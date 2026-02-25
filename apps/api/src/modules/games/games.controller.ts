import {
  PaginationParams,
  TypedBody,
  TypedController,
  TypedParam,
  TypedRoute,
} from '@lonestone/nzoth/server'
import {
  Headers,
  Query,
  UnauthorizedException,
} from '@nestjs/common'
import { z } from 'zod'
import {
  chooseSideSchema,
  CreateGameInput,
  createGameResponseSchema,
  createGameSchema,
  DesignatePlayerAsSpyInput,
  designatePlayerAsSpySchema,
  gameStateSchema,
  giveClueSchema,
  highlightWordSchema,
  JoinGameInput,
  joinGameResponseSchema,
  joinGameSchema,
  KickPlayerInput,
  kickPlayerSchema,
  selectWordSchema,
  sendChatSchema,
  startRoundSchema,
  TimelinePagination,
  timelinePaginationSchema,
  timelineResponseSchema,
} from './contracts/games.contract'
import { GamesService } from './games.service'

const playerIdHeaderSchema = z.uuid()

function getPlayerId(headers: Record<string, string | string[] | undefined>): string {
  const value = headers['x-player-id']
  const header = Array.isArray(value) ? value[0] : value
  const parsed = playerIdHeaderSchema.safeParse(header)
  if (!parsed.success)
    throw new UnauthorizedException('X-Player-Id header required (valid UUID)')
  return parsed.data
}

@TypedController('games', undefined, {
  tags: ['Games'],
})
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @TypedRoute.Post('', createGameResponseSchema)
  async createGame(@TypedBody(createGameSchema) body: CreateGameInput) {
    return await this.gamesService.createGame(body.pseudo)
  }

  @TypedRoute.Get(':id/state', gameStateSchema)
  async getGameState(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @TypedParam('id', z.uuid()) id: string,
  ) {
    const playerId = headers['x-player-id']
    const resolvedPlayerId = typeof playerId === 'string'
      ? playerId
      : Array.isArray(playerId) && playerId[0]
        ? playerId[0]
        : undefined
    return await this.gamesService.getGameState(id, resolvedPlayerId)
  }

  @TypedRoute.Post(':id/join', joinGameResponseSchema)
  async joinGame(
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(joinGameSchema) body: JoinGameInput,
  ) {
    return await this.gamesService.joinGame(id, body.pseudo)
  }

  @TypedRoute.Delete(':id/players/:playerId', gameStateSchema)
  async kickPlayer(
    @TypedParam('id', z.uuid()) id: string,
    @TypedParam('playerId', z.uuid()) playerId: string,
    @TypedBody(kickPlayerSchema) body: KickPlayerInput,
  ) {
    return await this.gamesService.kickPlayer(id, playerId, body)
  }

  @TypedRoute.Delete(':id/leave', gameStateSchema)
  async leaveGame(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @TypedParam('id', z.uuid()) id: string,
  ) {
    const playerId = getPlayerId(headers)
    return await this.gamesService.leaveGame(id, playerId)
  }

  @TypedRoute.Patch(':id/players/me/side', gameStateSchema)
  async chooseSide(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(chooseSideSchema) body: { side: 'red' | 'blue' },
  ) {
    const playerId = getPlayerId(headers)
    return await this.gamesService.chooseSide(id, playerId, body)
  }

  @TypedRoute.Patch(':id/players/me/spy', gameStateSchema)
  async designateSpy(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @TypedParam('id', z.uuid()) id: string,
  ) {
    const playerId = getPlayerId(headers)
    return await this.gamesService.designateSpy(id, playerId)
  }

  @TypedRoute.Patch(':id/players/:playerId/spy', gameStateSchema)
  async designatePlayerAsSpy(
    @TypedParam('id', z.uuid()) id: string,
    @TypedParam('playerId', z.uuid()) targetPlayerId: string,
    @TypedBody(designatePlayerAsSpySchema) body: DesignatePlayerAsSpyInput,
  ) {
    return await this.gamesService.designatePlayerAsSpy(id, targetPlayerId, body)
  }

  @TypedRoute.Post(':id/rounds/start', gameStateSchema)
  async startRound(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(startRoundSchema.optional()) body?: { wordCount?: number },
  ) {
    const playerId = getPlayerId(headers)
    return await this.gamesService.startRound(id, playerId, body)
  }

  @TypedRoute.Post(':id/rounds/current/clue', gameStateSchema)
  async giveClue(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(giveClueSchema) body: { word: string, number: number },
  ) {
    const playerId = getPlayerId(headers)
    return await this.gamesService.giveClue(id, playerId, body)
  }

  @TypedRoute.Post(':id/rounds/current/select', gameStateSchema)
  async selectWord(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(selectWordSchema) body: { wordIndex: number },
  ) {
    const playerId = getPlayerId(headers)
    return await this.gamesService.selectWord(id, playerId, body)
  }

  @TypedRoute.Post(':id/rounds/current/highlight', gameStateSchema)
  async highlightWord(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(highlightWordSchema) body: { wordIndex: number },
  ) {
    const playerId = getPlayerId(headers)
    return await this.gamesService.highlightWord(id, playerId, body)
  }

  @TypedRoute.Delete(':id/rounds/current/highlight/:wordIndex', gameStateSchema)
  async unhighlightWord(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @TypedParam('id', z.uuid()) id: string,
    @TypedParam('wordIndex', z.coerce.number().int().min(0)) wordIndex: number,
  ) {
    const playerId = getPlayerId(headers)
    return await this.gamesService.unhighlightWord(id, playerId, wordIndex)
  }

  @TypedRoute.Post(':id/rounds/current/pass', gameStateSchema)
  async passTurn(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @TypedParam('id', z.uuid()) id: string,
  ) {
    const playerId = getPlayerId(headers)
    return await this.gamesService.passTurn(id, playerId)
  }

  @TypedRoute.Post(':id/restart', gameStateSchema)
  async restartGame(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @TypedParam('id', z.uuid()) id: string,
  ) {
    const playerId = getPlayerId(headers)
    return await this.gamesService.restartGame(id, playerId)
  }

  @TypedRoute.Post(':id/chat')
  async sendChat(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(sendChatSchema) body: { content: string },
  ) {
    const playerId = getPlayerId(headers)
    await this.gamesService.sendChatMessage(id, playerId, body)
  }

  @TypedRoute.Get(':id/timeline', timelineResponseSchema)
  async getTimeline(
    @TypedParam('id', z.uuid()) id: string,
    @PaginationParams(timelinePaginationSchema) pagination: TimelinePagination,
    @Query('roundId') roundId?: string,
  ) {
    return await this.gamesService.getTimeline(id, { ...pagination, roundId })
  }
}
