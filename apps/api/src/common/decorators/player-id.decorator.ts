import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'
import type { Request } from 'express'
import { z } from 'zod'

const PLAYER_ID_HEADER = 'x-player-id'

const playerIdSchema = z.uuid()

function getPlayerIdHeaderValue(
  headers: Record<string, string | string[] | undefined>,
): string | undefined {
  const value = headers[PLAYER_ID_HEADER]
  if (typeof value === 'string')
    return value
  if (Array.isArray(value) && value[0])
    return value[0]
  return undefined
}

export const PlayerId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>()
    const raw = getPlayerIdHeaderValue(
      request.headers as Record<string, string | string[] | undefined>,
    )
    const parsed = playerIdSchema.safeParse(raw)
    if (!parsed.success) {
      throw new UnauthorizedException(
        'X-Player-Id header required (valid UUID)',
      )
    }
    return parsed.data
  },
)

export const OptionalPlayerId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>()
    return getPlayerIdHeaderValue(
      request.headers as Record<string, string | string[] | undefined>,
    )
  },
)
