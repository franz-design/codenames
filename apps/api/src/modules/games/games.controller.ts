import {
  PaginationParams,
  SortingParams,
  TypedBody,
  TypedController,
  TypedParam,
  TypedRoute,
} from '@lonestone/nzoth/server'
import { UseGuards } from '@nestjs/common'
import { LoggedInBetterAuthSession } from 'src/config/better-auth.config'
import { z } from 'zod'
import { Session } from '../auth/auth.decorator'
import { AuthGuard } from '../auth/auth.guard'
import {
  chooseSideSchema,
  CreateGameInput,
  createGameSchema,
  gameSchema,
  gameStateSchema,
  GamePagination,
  gamePaginationSchema,
  GameSorting,
  gameSortingSchema,
  gamesSchema,
  giveClueSchema,
  highlightWordSchema,
  selectWordSchema,
  startRoundSchema,
} from './contracts/games.contract'
import { GamesService } from './games.service'

@TypedController('games', undefined, {
  tags: ['Games'],
})
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @TypedRoute.Post('', gameSchema)
  @UseGuards(AuthGuard)
  async createGame(
    @Session() session: LoggedInBetterAuthSession,
    @TypedBody(createGameSchema) _body: CreateGameInput,
  ) {
    return await this.gamesService.createGame(session.user.id)
  }

  @TypedRoute.Get('', gamesSchema)
  async getGames(
    @PaginationParams(gamePaginationSchema) pagination: GamePagination,
    @SortingParams(gameSortingSchema) sort?: GameSorting,
  ) {
    return await this.gamesService.getGames(pagination, sort)
  }

  @TypedRoute.Get(':id', gameSchema)
  async getGame(@TypedParam('id', z.uuid()) id: string) {
    return await this.gamesService.getGame(id)
  }

  @TypedRoute.Get(':id/state', gameStateSchema)
  @UseGuards(AuthGuard)
  async getGameState(
    @Session() session: LoggedInBetterAuthSession,
    @TypedParam('id', z.uuid()) id: string,
  ) {
    return await this.gamesService.getGameState(id, session.user.id)
  }

  @TypedRoute.Post(':id/join', gameStateSchema)
  @UseGuards(AuthGuard)
  async joinGame(
    @Session() session: LoggedInBetterAuthSession,
    @TypedParam('id', z.uuid()) id: string,
  ) {
    return await this.gamesService.joinGame(id, session.user.id)
  }

  @TypedRoute.Delete(':id/leave', gameStateSchema)
  @UseGuards(AuthGuard)
  async leaveGame(
    @Session() session: LoggedInBetterAuthSession,
    @TypedParam('id', z.uuid()) id: string,
  ) {
    return await this.gamesService.leaveGame(id, session.user.id)
  }

  @TypedRoute.Patch(':id/players/me/side', gameStateSchema)
  @UseGuards(AuthGuard)
  async chooseSide(
    @Session() session: LoggedInBetterAuthSession,
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(chooseSideSchema) body: { side: 'red' | 'blue' },
  ) {
    return await this.gamesService.chooseSide(id, session.user.id, body)
  }

  @TypedRoute.Patch(':id/players/me/spy', gameStateSchema)
  @UseGuards(AuthGuard)
  async designateSpy(
    @Session() session: LoggedInBetterAuthSession,
    @TypedParam('id', z.uuid()) id: string,
  ) {
    return await this.gamesService.designateSpy(id, session.user.id)
  }

  @TypedRoute.Post(':id/rounds/start', gameStateSchema)
  @UseGuards(AuthGuard)
  async startRound(
    @Session() session: LoggedInBetterAuthSession,
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(startRoundSchema.optional()) body?: { wordCount?: number },
  ) {
    return await this.gamesService.startRound(id, session.user.id, body)
  }

  @TypedRoute.Post(':id/rounds/current/clue', gameStateSchema)
  @UseGuards(AuthGuard)
  async giveClue(
    @Session() session: LoggedInBetterAuthSession,
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(giveClueSchema) body: { word: string; number: number },
  ) {
    return await this.gamesService.giveClue(id, session.user.id, body)
  }

  @TypedRoute.Post(':id/rounds/current/select', gameStateSchema)
  @UseGuards(AuthGuard)
  async selectWord(
    @Session() session: LoggedInBetterAuthSession,
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(selectWordSchema) body: { wordIndex: number },
  ) {
    return await this.gamesService.selectWord(id, session.user.id, body)
  }

  @TypedRoute.Post(':id/rounds/current/highlight', gameStateSchema)
  @UseGuards(AuthGuard)
  async highlightWord(
    @Session() session: LoggedInBetterAuthSession,
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(highlightWordSchema) body: { wordIndex: number },
  ) {
    return await this.gamesService.highlightWord(id, session.user.id, body)
  }

  @TypedRoute.Delete(':id/rounds/current/highlight/:wordIndex', gameStateSchema)
  @UseGuards(AuthGuard)
  async unhighlightWord(
    @Session() session: LoggedInBetterAuthSession,
    @TypedParam('id', z.uuid()) id: string,
    @TypedParam('wordIndex', z.coerce.number().int().min(0)) wordIndex: number,
  ) {
    return await this.gamesService.unhighlightWord(id, session.user.id, wordIndex)
  }

  @TypedRoute.Post(':id/rounds/current/pass', gameStateSchema)
  @UseGuards(AuthGuard)
  async passTurn(
    @Session() session: LoggedInBetterAuthSession,
    @TypedParam('id', z.uuid()) id: string,
  ) {
    return await this.gamesService.passTurn(id, session.user.id)
  }

  @TypedRoute.Post(':id/restart', gameStateSchema)
  @UseGuards(AuthGuard)
  async restartGame(
    @Session() session: LoggedInBetterAuthSession,
    @TypedParam('id', z.uuid()) id: string,
  ) {
    return await this.gamesService.restartGame(id, session.user.id)
  }
}
