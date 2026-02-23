import {
  createFilterQueryStringSchema,
  createPaginationQuerySchema,
  createSortingQueryStringSchema,
  paginatedSchema,
} from '@lonestone/nzoth/server'
import { z } from 'zod'

export const sideSchema = z.enum(['red', 'blue']).meta({
  title: 'SideSchema',
  description: 'Player side in a game',
})

export type Side = z.infer<typeof sideSchema>

export const createGameSchema = z.object({
  timer: z.number().int().positive().optional(),
}).meta({
  title: 'CreateGameSchema',
  description: 'Schema for creating a game',
})

export type CreateGameInput = z.infer<typeof createGameSchema>

export const addPlayerToGameSchema = z.object({
  playerId: z.uuid(),
  side: sideSchema,
}).meta({
  title: 'AddPlayerToGameSchema',
  description: 'Schema for adding a player to a game',
})

export type AddPlayerToGameInput = z.infer<typeof addPlayerToGameSchema>

export const updatePlayerSideSchema = z.object({
  side: sideSchema,
}).meta({
  title: 'UpdatePlayerSideSchema',
  description: 'Schema for updating a player side in a game',
})

export type UpdatePlayerSideInput = z.infer<typeof updatePlayerSideSchema>

export const gamePlayerSchema = z.object({
  id: z.uuid(),
  player: z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.string().email(),
  }),
  side: sideSchema.nullable(),
}).meta({
  title: 'GamePlayerSchema',
  description: 'Schema for a game player',
})

export const gameSchema = z.object({
  id: z.uuid(),
  timer: z.number().int().positive().nullable(),
  createdBy: z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.string().email(),
  }),
  createdAt: z.date(),
  players: z.array(gamePlayerSchema),
}).meta({
  title: 'GameSchema',
  description: 'Schema for a game',
})

export type GameResponse = z.infer<typeof gameSchema>

export const gamesSchema = paginatedSchema(gameSchema).meta({
  title: 'GamesSchema',
  description: 'Schema for a paginated list of games',
})

export type GamesResponse = z.infer<typeof gamesSchema>

export const enabledGameSortingKey = [
  'createdAt',
] as const

export const gameSortingSchema = createSortingQueryStringSchema(
  enabledGameSortingKey,
)

export type GameSorting = z.infer<typeof gameSortingSchema>

export const enabledGameFilteringKeys = [] as const

export const gameFilteringSchema = createFilterQueryStringSchema(
  enabledGameFilteringKeys,
)

export type GameFiltering = z.infer<typeof gameFilteringSchema>

export const gamePaginationSchema = createPaginationQuerySchema()

export type GamePagination = z.infer<typeof gamePaginationSchema>
