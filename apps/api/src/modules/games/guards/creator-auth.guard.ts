import type { Request } from 'express'
import { EntityManager } from '@mikro-orm/core'
import {
  applyDecorators,
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  SetMetadata,
  UseGuards,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { z } from 'zod'
import { Game } from '../games.entity'

export const CREATOR_AUTH_MESSAGE_KEY = 'creatorAuthMessage'

export function CreatorAuth(message: string) {
  return applyDecorators(
    SetMetadata(CREATOR_AUTH_MESSAGE_KEY, message),
    UseGuards(CreatorAuthGuard),
  )
}

@Injectable()
export class CreatorAuthGuard implements CanActivate {
  constructor(
    private readonly em: EntityManager,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const message = this.reflector.get<string>(
      CREATOR_AUTH_MESSAGE_KEY,
      context.getHandler(),
    ) ?? 'Only the game creator can perform this action'

    const request = context.switchToHttp().getRequest<Request>()
    const gameId = request.params.id
    const creatorTokenRaw = (request.body as { creatorToken?: unknown } | undefined)
      ?.creatorToken
    const parsed = z.uuid().safeParse(creatorTokenRaw)
    if (!parsed.success)
      throw new BadRequestException('creatorToken must be a valid UUID')

    const game = await this.em.findOne(Game, { id: gameId })
    if (!game)
      throw new NotFoundException('Game not found')

    if (game.creatorToken !== parsed.data)
      throw new ForbiddenException(message)

    return true
  }
}
