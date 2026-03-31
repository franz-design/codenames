import {
  PaginationParams,
  TypedBody,
  TypedController,
  TypedParam,
  TypedRoute,
} from '@lonestone/nzoth/server'
import { Query } from '@nestjs/common'
import { z } from 'zod'
import { OptionalPlayerId, PlayerId } from '../../common/decorators/player-id.decorator'
import {
  assignPlayerSideByCreatorSchema,
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
import { CreatorAuth } from './guards/creator-auth.guard'

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
    @OptionalPlayerId() resolvedPlayerId: string | undefined,
    @TypedParam('id', z.uuid()) id: string,
  ) {
    return await this.gamesService.getGameState(id, resolvedPlayerId)
  }

  @TypedRoute.Post(':id/join', joinGameResponseSchema)
  async joinGame(
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(joinGameSchema) body: JoinGameInput,
  ) {
    return await this.gamesService.joinGame(id, body.pseudo)
  }

  @CreatorAuth('Only the game creator can kick players')
  @TypedRoute.Delete(':id/players/:playerId', gameStateSchema)
  async kickPlayer(
    @TypedParam('id', z.uuid()) id: string,
    @TypedParam('playerId', z.uuid()) playerId: string,
    @TypedBody(kickPlayerSchema) _body: KickPlayerInput,
  ) {
    return await this.gamesService.kickPlayer(id, playerId)
  }

  @TypedRoute.Delete(':id/leave', gameStateSchema)
  async leaveGame(
    @PlayerId() playerId: string,
    @TypedParam('id', z.uuid()) id: string,
  ) {
    return await this.gamesService.leaveGame(id, playerId)
  }

  @TypedRoute.Patch(':id/players/me/side', gameStateSchema)
  async chooseSide(
    @PlayerId() playerId: string,
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(chooseSideSchema) body: { side: 'red' | 'blue' },
  ) {
    return await this.gamesService.chooseSide(id, playerId, body)
  }

  @CreatorAuth('Only the game creator can assign players to a team during a round')
  @TypedRoute.Patch(':id/creator/players/:playerId/side', gameStateSchema)
  async assignPlayerSideByCreator(
    @TypedParam('id', z.uuid()) id: string,
    @TypedParam('playerId', z.uuid()) playerId: string,
    @TypedBody(assignPlayerSideByCreatorSchema) body: { side: 'red' | 'blue', creatorToken: string },
  ) {
    return await this.gamesService.assignPlayerSideByCreator(id, playerId, body)
  }

  @TypedRoute.Patch(':id/players/me/spy', gameStateSchema)
  async designateSpy(
    @PlayerId() playerId: string,
    @TypedParam('id', z.uuid()) id: string,
  ) {
    return await this.gamesService.designateSpy(id, playerId)
  }

  @CreatorAuth('Only the game creator can designate spies')
  @TypedRoute.Patch(':id/players/:playerId/spy', gameStateSchema)
  async designatePlayerAsSpy(
    @TypedParam('id', z.uuid()) id: string,
    @TypedParam('playerId', z.uuid()) targetPlayerId: string,
    @TypedBody(designatePlayerAsSpySchema) _body: DesignatePlayerAsSpyInput,
  ) {
    return await this.gamesService.designatePlayerAsSpy(id, targetPlayerId)
  }

  @TypedRoute.Post(':id/rounds/start', gameStateSchema)
  async startRound(
    @PlayerId() playerId: string,
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(startRoundSchema.optional()) body?: { wordCount?: number },
  ) {
    return await this.gamesService.startRound(id, playerId, body)
  }

  @TypedRoute.Post(':id/rounds/current/clue', gameStateSchema)
  async giveClue(
    @PlayerId() playerId: string,
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(giveClueSchema) body: { word: string, number: number },
  ) {
    return await this.gamesService.giveClue(id, playerId, body)
  }

  @TypedRoute.Post(':id/rounds/current/select', gameStateSchema)
  async selectWord(
    @PlayerId() playerId: string,
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(selectWordSchema) body: { wordIndex: number },
  ) {
    return await this.gamesService.selectWord(id, playerId, body)
  }

  @TypedRoute.Post(':id/rounds/current/highlight', gameStateSchema)
  async highlightWord(
    @PlayerId() playerId: string,
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(highlightWordSchema) body: { wordIndex: number },
  ) {
    return await this.gamesService.highlightWord(id, playerId, body)
  }

  @TypedRoute.Delete(':id/rounds/current/highlight/:wordIndex', gameStateSchema)
  async unhighlightWord(
    @PlayerId() playerId: string,
    @TypedParam('id', z.uuid()) id: string,
    @TypedParam('wordIndex', z.coerce.number().int().min(0)) wordIndex: number,
  ) {
    return await this.gamesService.unhighlightWord(id, playerId, wordIndex)
  }

  @TypedRoute.Post(':id/rounds/current/pass', gameStateSchema)
  async passTurn(
    @PlayerId() playerId: string,
    @TypedParam('id', z.uuid()) id: string,
  ) {
    return await this.gamesService.passTurn(id, playerId)
  }

  @TypedRoute.Post(':id/restart', gameStateSchema)
  async restartGame(
    @PlayerId() playerId: string,
    @TypedParam('id', z.uuid()) id: string,
  ) {
    return await this.gamesService.restartGame(id, playerId)
  }

  @TypedRoute.Post(':id/chat')
  async sendChat(
    @PlayerId() playerId: string,
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(sendChatSchema) body: { content: string },
  ) {
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
