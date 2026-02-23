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
  RoundPagination,
  roundPaginationSchema,
  RoundSorting,
  roundSortingSchema,
  roundsSchema,
} from '../rounds/contracts/rounds.contract'
import { RoundsService } from '../rounds/rounds.service'
import {
  AddPlayerToGameInput,
  addPlayerToGameSchema,
  CreateGameInput,
  createGameSchema,
  GamePagination,
  gamePaginationSchema,
  gameSchema,
  GameSorting,
  gameSortingSchema,
  gamesSchema,
  UpdatePlayerSideInput,
  updatePlayerSideSchema,
} from './contracts/games.contract'
import { GamesService } from './games.service'

@TypedController('games', undefined, {
  tags: ['Games'],
})
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly roundsService: RoundsService,
  ) {}

  @TypedRoute.Post('', gameSchema)
  @UseGuards(AuthGuard)
  async createGame(
    @Session() session: LoggedInBetterAuthSession,
    @TypedBody(createGameSchema) body: CreateGameInput,
  ) {
    return await this.gamesService.createGame(session.user.id, body)
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

  @TypedRoute.Post(':id/players', gameSchema)
  @UseGuards(AuthGuard)
  async addPlayerToGame(
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(addPlayerToGameSchema) body: AddPlayerToGameInput,
  ) {
    return await this.gamesService.addPlayerToGame(id, body)
  }

  @TypedRoute.Delete(':id/players/:playerId', gameSchema)
  @UseGuards(AuthGuard)
  async removePlayerFromGame(
    @TypedParam('id', z.uuid()) id: string,
    @TypedParam('playerId', z.uuid()) playerId: string,
  ) {
    return await this.gamesService.removePlayerFromGame(id, playerId)
  }

  @TypedRoute.Post(':id/join', gameSchema)
  @UseGuards(AuthGuard)
  async joinGame(
    @Session() session: LoggedInBetterAuthSession,
    @TypedParam('id', z.uuid()) id: string,
  ) {
    return await this.gamesService.joinGame(id, session.user.id)
  }

  @TypedRoute.Patch(':id/players/:playerId', gameSchema)
  @UseGuards(AuthGuard)
  async updatePlayerSide(
    @TypedParam('id', z.uuid()) id: string,
    @TypedParam('playerId', z.uuid()) playerId: string,
    @TypedBody(updatePlayerSideSchema) body: UpdatePlayerSideInput,
  ) {
    return await this.gamesService.updatePlayerSide(id, playerId, body)
  }

  @TypedRoute.Get(':id/rounds', roundsSchema)
  async getRoundsByGame(
    @TypedParam('id', z.uuid()) id: string,
    @PaginationParams(roundPaginationSchema) pagination: RoundPagination,
    @SortingParams(roundSortingSchema) sort?: RoundSorting,
  ) {
    return await this.roundsService.getRoundsByGame(id, pagination, sort)
  }
}
