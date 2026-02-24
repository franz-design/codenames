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

export const cardTypeSchema = z.enum(['neutral', 'red', 'blue', 'black']).meta({
  title: 'CardTypeSchema',
  description: 'Card type in the grid',
})

export const createGameSchema = z.object({
  pseudo: z.string().min(1).max(100),
}).meta({
  title: 'CreateGameSchema',
  description: 'Schema for creating a game',
})

export type CreateGameInput = z.infer<typeof createGameSchema>

export const joinGameSchema = z.object({
  pseudo: z.string().min(1).max(100),
}).meta({
  title: 'JoinGameSchema',
  description: 'Schema for joining a game',
})

export type JoinGameInput = z.infer<typeof joinGameSchema>

export const kickPlayerSchema = z.object({
  creatorToken: z.string().uuid(),
}).meta({
  title: 'KickPlayerSchema',
  description: 'Schema for kicking a player (creator only)',
})

export type KickPlayerInput = z.infer<typeof kickPlayerSchema>

export const designatePlayerAsSpySchema = z.object({
  creatorToken: z.string().uuid(),
}).meta({
  title: 'DesignatePlayerAsSpySchema',
  description: 'Schema for creator to designate a player as spy',
})

export type DesignatePlayerAsSpyInput = z.infer<typeof designatePlayerAsSpySchema>

export const gameStatePlayerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  side: sideSchema.nullable(),
  isSpy: z.boolean().optional(),
}).meta({
  title: 'GameStatePlayerSchema',
  description: 'Player in game state',
})

export const revealedWordSchema = z.object({
  wordIndex: z.number().int().min(0),
  cardType: cardTypeSchema,
}).meta({
  title: 'RevealedWordSchema',
  description: 'Revealed word in the grid',
})

export const roundStateSchema = z.object({
  id: z.string().uuid(),
  words: z.array(z.string()),
  results: z.array(cardTypeSchema).optional(),
  order: z.number().int().positive(),
  currentTurn: sideSchema,
  currentClue: z.object({
    word: z.string(),
    number: z.number().int().min(0),
  }).nullable(),
  guessesRemaining: z.number().int().min(0),
  revealedWords: z.array(revealedWordSchema),
  highlights: z.record(
    z.string(),
    z.array(z.object({
      playerId: z.string().uuid(),
      playerName: z.string(),
    })),
  ),
}).meta({
  title: 'RoundStateSchema',
  description: 'Current round state',
})

export const gameStateSchema = z.object({
  status: z.enum(['LOBBY', 'PLAYING', 'FINISHED']),
  players: z.array(gameStatePlayerSchema),
  currentRound: roundStateSchema.nullable(),
  winningSide: sideSchema.nullable(),
  losingSide: sideSchema.nullable(),
}).meta({
  title: 'GameStateSchema',
  description: 'Full game state computed from events',
})

export type GameStateResponse = z.infer<typeof gameStateSchema>

export const gameSchema = z.object({
  id: z.uuid(),
  creatorPseudo: z.string(),
  createdAt: z.date(),
}).meta({
  title: 'GameSchema',
  description: 'Schema for a game (basic info)',
})

export type GameResponse = z.infer<typeof gameSchema>

export const createGameResponseSchema = z.object({
  game: gameSchema,
  creatorToken: z.string().uuid(),
  playerId: z.string().uuid(),
  gameState: gameStateSchema,
}).meta({
  title: 'CreateGameResponseSchema',
  description: 'Response when creating a game',
})

export type CreateGameResponse = z.infer<typeof createGameResponseSchema>

export const joinGameResponseSchema = z.object({
  gameState: gameStateSchema,
  playerId: z.string().uuid(),
}).meta({
  title: 'JoinGameResponseSchema',
  description: 'Response when joining a game',
})

export type JoinGameResponse = z.infer<typeof joinGameResponseSchema>

export const gamesSchema = paginatedSchema(gameSchema).meta({
  title: 'GamesSchema',
  description: 'Schema for a paginated list of games',
})

export type GamesResponse = z.infer<typeof gamesSchema>

export const enabledGameSortingKey = ['createdAt'] as const

export const gameSortingSchema = createSortingQueryStringSchema(
  enabledGameSortingKey,
)

export type GameSorting = z.infer<typeof gameSortingSchema>

export const enabledGameFilteringKeys = ['createdAt'] as const

export const gameFilteringSchema = createFilterQueryStringSchema(
  enabledGameFilteringKeys,
)

export type GameFiltering = z.infer<typeof gameFilteringSchema>

export const gamePaginationSchema = createPaginationQuerySchema()

export type GamePagination = z.infer<typeof gamePaginationSchema>

export const chooseSideSchema = z.object({
  side: sideSchema,
}).meta({
  title: 'ChooseSideSchema',
  description: 'Schema for choosing team side',
})

export type ChooseSideInput = z.infer<typeof chooseSideSchema>

export const giveClueSchema = z.object({
  word: z.string().min(1),
  number: z.number().int().min(0),
}).meta({
  title: 'GiveClueSchema',
  description: 'Schema for giving a clue',
})

export type GiveClueInput = z.infer<typeof giveClueSchema>

export const selectWordSchema = z.object({
  wordIndex: z.number().int().min(0),
}).meta({
  title: 'SelectWordSchema',
  description: 'Schema for selecting a word',
})

export type SelectWordInput = z.infer<typeof selectWordSchema>

export const highlightWordSchema = z.object({
  wordIndex: z.number().int().min(0),
}).meta({
  title: 'HighlightWordSchema',
  description: 'Schema for highlighting a word',
})

export type HighlightWordInput = z.infer<typeof highlightWordSchema>

export const startRoundSchema = z.object({
  wordCount: z.number().int().positive().min(1).max(400).optional(),
}).meta({
  title: 'StartRoundSchema',
  description: 'Schema for starting a round',
})

export type StartRoundInput = z.infer<typeof startRoundSchema>
