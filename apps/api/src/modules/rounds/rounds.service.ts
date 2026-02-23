import { EntityManager, FilterQuery } from '@mikro-orm/core'
import { Injectable, NotFoundException } from '@nestjs/common'
import { User } from '../auth/auth.entity'
import { Game } from '../games/games.entity'
import {
  AddPlayerRoleToRoundInput,
  CreateRoundEventInput,
  CreateRoundInput,
  RoundPagination,
  RoundResponse,
  RoundSorting,
  RoundsResponse,
} from './contracts/rounds.contract'
import {
  CardType,
  EventType,
  Role,
  Round,
  RoundEvent,
  RoundPlayerRole,
} from './rounds.entity'

@Injectable()
export class RoundsService {
  constructor(private readonly em: EntityManager) {}

  private generateRandomResults(order: number): CardType[] {
    const results: CardType[] = []

    // Add 1 black
    results.push(CardType.BLACK)

    // Add 7 neutral
    for (let i = 0; i < 7; i++) {
      results.push(CardType.NEUTRAL)
    }

    // Add red and blue based on order parity
    const redCount = order % 2 === 0 ? 8 : 9
    const blueCount = order % 2 === 0 ? 9 : 8

    for (let i = 0; i < redCount; i++) {
      results.push(CardType.RED)
    }

    for (let i = 0; i < blueCount; i++) {
      results.push(CardType.BLUE)
    }

    // Shuffle the array randomly
    for (let i = results.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[results[i], results[j]] = [results[j], results[i]]
    }

    return results
  }

  async createRound(data: CreateRoundInput): Promise<RoundResponse> {
    const game = await this.em.findOne(Game, { id: data.gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    const round = new Round()
    round.game = game
    round.order = data.order
    round.words = data.words
    round.results = this.generateRandomResults(data.order)

    await this.em.persistAndFlush(round)

    return this.mapRoundToResponse(round)
  }

  async getRound(roundId: string): Promise<RoundResponse> {
    const round = await this.em.findOne(
      Round,
      { id: roundId },
      {
        populate: [
          'playerRoles',
          'playerRoles.player',
          'events',
          'events.player',
        ],
      },
    )
    if (!round)
      throw new NotFoundException('Round not found')

    return this.mapRoundToResponse(round)
  }

  async getRoundsByGame(
    gameId: string,
    pagination: RoundPagination,
    sort?: RoundSorting,
  ): Promise<RoundsResponse> {
    const where: FilterQuery<Round> = { game: gameId }
    const orderBy: Record<string, 'ASC' | 'DESC'> = { order: 'ASC' }

    if (sort?.length) {
      sort.forEach((sortItem) => {
        orderBy[sortItem.property] = sortItem.direction.toUpperCase() as
        | 'ASC'
        | 'DESC'
      })
    }

    const [rounds, total] = await this.em.findAndCount(Round, where, {
      populate: [
        'playerRoles',
        'playerRoles.player',
        'events',
        'events.player',
      ],
      orderBy,
      limit: pagination.pageSize,
      offset: pagination.offset,
    })

    return {
      data: rounds.map(round => this.mapRoundToResponse(round)),
      meta: {
        itemCount: total,
        pageSize: pagination.pageSize,
        offset: pagination.offset,
        hasMore: pagination.offset + pagination.pageSize < total,
      },
    }
  }

  async addPlayerRoleToRound(
    roundId: string,
    data: AddPlayerRoleToRoundInput,
  ): Promise<RoundResponse> {
    const round = await this.em.findOne(Round, { id: roundId })
    if (!round)
      throw new NotFoundException('Round not found')

    const player = await this.em.findOne(User, { id: data.playerId })
    if (!player)
      throw new NotFoundException('Player not found')

    const existingRole = await this.em.findOne(RoundPlayerRole, {
      round: roundId,
      player: data.playerId,
    })
    if (existingRole)
      throw new Error('Player role already exists in round')

    const roundPlayerRole = new RoundPlayerRole()
    roundPlayerRole.round = round
    roundPlayerRole.player = player
    roundPlayerRole.role = data.role as Role

    await this.em.persistAndFlush(roundPlayerRole)

    const updatedRound = await this.em.findOne(
      Round,
      { id: roundId },
      {
        populate: [
          'playerRoles',
          'playerRoles.player',
          'events',
          'events.player',
        ],
      },
    )
    if (!updatedRound)
      throw new NotFoundException('Round not found')

    return this.mapRoundToResponse(updatedRound)
  }

  async createRoundEvent(
    userId: string,
    data: CreateRoundEventInput,
  ): Promise<RoundResponse> {
    const round = await this.em.findOne(Round, { id: data.roundId })
    if (!round)
      throw new NotFoundException('Round not found')

    const player = await this.em.findOne(User, { id: userId })
    if (!player)
      throw new NotFoundException('Player not found')

    const roundEvent = new RoundEvent()
    roundEvent.round = round
    roundEvent.player = player
    roundEvent.event = data.event as EventType
    roundEvent.payload = data.payload

    await this.em.persistAndFlush(roundEvent)

    const updatedRound = await this.em.findOne(
      Round,
      { id: data.roundId },
      {
        populate: [
          'playerRoles',
          'playerRoles.player',
          'events',
          'events.player',
        ],
      },
    )
    if (!updatedRound)
      throw new NotFoundException('Round not found')

    return this.mapRoundToResponse(updatedRound)
  }

  private mapRoundToResponse(round: Round): RoundResponse {
    return {
      id: round.id,
      gameId: round.game.id,
      order: round.order,
      words: round.words,
      results: round.results as CardType[],
      createdAt: round.createdAt,
      playerRoles: round.playerRoles.isInitialized()
        ? round.playerRoles.getItems().map(rpr => ({
            id: rpr.id,
            player: {
              id: rpr.player.id,
              name: rpr.player.name,
              email: rpr.player.email,
            },
            role: rpr.role,
          }))
        : [],
      events: round.events.isInitialized()
        ? round.events.getItems().map(re => ({
            id: re.id,
            player: {
              id: re.player.id,
              name: re.player.name,
              email: re.player.email,
            },
            event: re.event,
            payload: re.payload,
            createdAt: re.createdAt,
          }))
        : [],
    }
  }
}
