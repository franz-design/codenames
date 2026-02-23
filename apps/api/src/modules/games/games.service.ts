import { EntityManager, FilterQuery } from '@mikro-orm/core'
import { Injectable, NotFoundException } from '@nestjs/common'
import { User } from '../auth/auth.entity'
import {
  AddPlayerToGameInput,
  CreateGameInput,
  GamePagination,
  GameResponse,
  GameSorting,
  GamesResponse,
  UpdatePlayerSideInput,
} from './contracts/games.contract'
import { Game, GamePlayer, Side } from './games.entity'

@Injectable()
export class GamesService {
  constructor(private readonly em: EntityManager) {}

  async createGame(userId: string, data: CreateGameInput): Promise<GameResponse> {
    const user = await this.em.findOne(User, { id: userId })
    if (!user)
      throw new NotFoundException('User not found')

    const game = new Game()
    game.createdBy = user
    if (data.timer) {
      game.timer = data.timer
    }

    await this.em.persistAndFlush(game)

    return this.mapGameToResponse(game)
  }

  async getGame(gameId: string): Promise<GameResponse> {
    const game = await this.em.findOne(
      Game,
      { id: gameId },
      { populate: ['createdBy', 'players', 'players.player'] },
    )
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
        orderBy[sortItem.property] = sortItem.direction.toUpperCase() as
        | 'ASC'
        | 'DESC'
      })
    }

    const [games, total] = await this.em.findAndCount(Game, where, {
      populate: ['createdBy', 'players', 'players.player'],
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

  async addPlayerToGame(
    gameId: string,
    data: AddPlayerToGameInput,
  ): Promise<GameResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const player = await this.em.findOne(User, { id: data.playerId })
    if (!player)
      throw new NotFoundException('Player not found')

    const existingGamePlayer = await this.em.findOne(GamePlayer, {
      game: gameId,
      player: data.playerId,
    })
    if (existingGamePlayer)
      throw new Error('Player already in game')

    const gamePlayer = new GamePlayer()
    gamePlayer.game = game
    gamePlayer.player = player
    gamePlayer.side = data.side as Side

    await this.em.persistAndFlush(gamePlayer)

    const updatedGame = await this.em.findOne(
      Game,
      { id: gameId },
      { populate: ['createdBy', 'players', 'players.player'] },
    )
    if (!updatedGame)
      throw new NotFoundException('Game not found')

    return this.mapGameToResponse(updatedGame)
  }

  async removePlayerFromGame(
    gameId: string,
    playerId: string,
  ): Promise<GameResponse> {
    const gamePlayer = await this.em.findOne(GamePlayer, {
      game: gameId,
      player: playerId,
    })
    if (!gamePlayer)
      throw new NotFoundException('Player not found in game')

    await this.em.removeAndFlush(gamePlayer)

    const updatedGame = await this.em.findOne(
      Game,
      { id: gameId },
      { populate: ['createdBy', 'players', 'players.player'] },
    )
    if (!updatedGame)
      throw new NotFoundException('Game not found')

    return this.mapGameToResponse(updatedGame)
  }

  async joinGame(gameId: string, userId: string): Promise<GameResponse> {
    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const player = await this.em.findOne(User, { id: userId })
    if (!player)
      throw new NotFoundException('User not found')

    const existingGamePlayer = await this.em.findOne(GamePlayer, {
      game: gameId,
      player: userId,
    })
    if (existingGamePlayer)
      throw new Error('Player already in game')

    const gamePlayer = new GamePlayer()
    gamePlayer.game = game
    gamePlayer.player = player
    // side is not set, remains null

    await this.em.persistAndFlush(gamePlayer)

    const updatedGame = await this.em.findOne(
      Game,
      { id: gameId },
      { populate: ['createdBy', 'players', 'players.player'] },
    )
    if (!updatedGame)
      throw new NotFoundException('Game not found')

    return this.mapGameToResponse(updatedGame)
  }

  async updatePlayerSide(
    gameId: string,
    playerId: string,
    data: UpdatePlayerSideInput,
  ): Promise<GameResponse> {
    const gamePlayer = await this.em.findOne(GamePlayer, {
      game: gameId,
      player: playerId,
    })
    if (!gamePlayer)
      throw new NotFoundException('Player not found in game')

    gamePlayer.side = data.side as Side

    await this.em.persistAndFlush(gamePlayer)

    const updatedGame = await this.em.findOne(
      Game,
      { id: gameId },
      { populate: ['createdBy', 'players', 'players.player'] },
    )
    if (!updatedGame)
      throw new NotFoundException('Game not found')

    return this.mapGameToResponse(updatedGame)
  }

  private mapGameToResponse(game: Game): GameResponse {
    return {
      id: game.id,
      timer: game.timer ?? null,
      createdBy: {
        id: game.createdBy.id,
        name: game.createdBy.name,
        email: game.createdBy.email,
      },
      createdAt: game.createdAt,
      players: game.players.isInitialized()
        ? game.players.getItems().map(gp => ({
            id: gp.id,
            player: {
              id: gp.player.id,
              name: gp.player.name,
              email: gp.player.email,
            },
            side: gp.side ?? null,
          }))
        : [],
    }
  }
}
