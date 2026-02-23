import {
  createFilterQueryStringSchema,
  createPaginationQuerySchema,
  createSortingQueryStringSchema,
  paginatedSchema,
} from '@lonestone/nzoth/server'
import { z } from 'zod'

export const cardTypeSchema = z.enum(['neutral', 'red', 'blue', 'black']).meta({
  title: 'CardTypeSchema',
  description: 'Card type in a round',
})

export type CardType = z.infer<typeof cardTypeSchema>

export const roleSchema = z.enum(['spy', 'agent']).meta({
  title: 'RoleSchema',
  description: 'Player role in a round',
})

export type Role = z.infer<typeof roleSchema>

export const eventTypeSchema = z.enum(['card_selected', 'card_add_highlight', 'card_remove_highlight']).meta({
  title: 'EventTypeSchema',
  description: 'Event type in a round',
})

export type EventType = z.infer<typeof eventTypeSchema>

export const createRoundSchema = z.object({
  gameId: z.uuid(),
  order: z.number().int().positive(),
  words: z.array(z.string()).min(1),
}).meta({
  title: 'CreateRoundSchema',
  description: 'Schema for creating a round',
})

export type CreateRoundInput = z.infer<typeof createRoundSchema>

export const addPlayerRoleToRoundSchema = z.object({
  playerId: z.uuid(),
  role: roleSchema,
}).meta({
  title: 'AddPlayerRoleToRoundSchema',
  description: 'Schema for adding a player role to a round',
})

export type AddPlayerRoleToRoundInput = z.infer<typeof addPlayerRoleToRoundSchema>

export const createRoundEventSchema = z.object({
  roundId: z.uuid(),
  event: eventTypeSchema,
  payload: z.string(),
}).meta({
  title: 'CreateRoundEventSchema',
  description: 'Schema for creating a round event',
})

export type CreateRoundEventInput = z.infer<typeof createRoundEventSchema>

export const roundPlayerRoleSchema = z.object({
  id: z.uuid(),
  player: z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.string().email(),
  }),
  role: roleSchema,
}).meta({
  title: 'RoundPlayerRoleSchema',
  description: 'Schema for a round player role',
})

export const roundEventSchema = z.object({
  id: z.uuid(),
  player: z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.string().email(),
  }),
  event: eventTypeSchema,
  payload: z.string(),
  createdAt: z.date(),
}).meta({
  title: 'RoundEventSchema',
  description: 'Schema for a round event',
})

export const roundSchema = z.object({
  id: z.uuid(),
  gameId: z.uuid(),
  order: z.number().int().positive(),
  words: z.array(z.string()),
  results: z.array(cardTypeSchema),
  createdAt: z.date(),
  playerRoles: z.array(roundPlayerRoleSchema),
  events: z.array(roundEventSchema),
}).meta({
  title: 'RoundSchema',
  description: 'Schema for a round',
})

export type RoundResponse = z.infer<typeof roundSchema>

export const roundsSchema = paginatedSchema(roundSchema).meta({
  title: 'RoundsSchema',
  description: 'Schema for a paginated list of rounds',
})

export type RoundsResponse = z.infer<typeof roundsSchema>

export const enabledRoundSortingKey = [
  'createdAt',
  'order',
] as const

export const roundSortingSchema = createSortingQueryStringSchema(
  enabledRoundSortingKey,
)

export type RoundSorting = z.infer<typeof roundSortingSchema>

export const enabledRoundFilteringKeys = [] as const

export const roundFilteringSchema = createFilterQueryStringSchema(
  enabledRoundFilteringKeys,
)

export type RoundFiltering = z.infer<typeof roundFilteringSchema>

export const roundPaginationSchema = createPaginationQuerySchema()

export type RoundPagination = z.infer<typeof roundPaginationSchema>
