import {
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
import { WordResponse } from '../words/contracts/words.contract'
import { WordsService } from '../words/words.service'
import {
  AddPlayerRoleToRoundInput,
  addPlayerRoleToRoundSchema,
  CreateRoundEventInput,
  createRoundEventSchema,
  CreateRoundInput,
  createRoundSchema,
  roundSchema,
} from './contracts/rounds.contract'
import { RoundsService } from './rounds.service'

@TypedController('rounds', undefined, {
  tags: ['Rounds'],
})
export class RoundsController {
  constructor(private readonly roundsService: RoundsService, private readonly wordsService: WordsService) {}

  @TypedRoute.Post('', roundSchema)
  @UseGuards(AuthGuard)
  async createRound(
    @TypedBody(createRoundSchema) body: CreateRoundInput,
  ) {
    const words = await this.wordsService.getRandomWords({ count: 25 })
    return await this.roundsService.createRound({
      gameId: body.gameId,
      order: body.order,
      words: words.map((word: WordResponse) => word.label),
    })
  }

  @TypedRoute.Get(':id', roundSchema)
  async getRound(@TypedParam('id', z.uuid()) id: string) {
    return await this.roundsService.getRound(id)
  }

  @TypedRoute.Post(':id/player-roles', roundSchema)
  @UseGuards(AuthGuard)
  async addPlayerRoleToRound(
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(addPlayerRoleToRoundSchema) body: AddPlayerRoleToRoundInput,
  ) {
    return await this.roundsService.addPlayerRoleToRound(id, body)
  }

  @TypedRoute.Post(':id/events', roundSchema)
  @UseGuards(AuthGuard)
  async createRoundEvent(
    @Session() session: LoggedInBetterAuthSession,
    @TypedParam('id', z.uuid()) id: string,
    @TypedBody(createRoundEventSchema) body: CreateRoundEventInput,
  ) {
    return await this.roundsService.createRoundEvent(session.user.id, {
      ...body,
      roundId: id,
    })
  }
}
