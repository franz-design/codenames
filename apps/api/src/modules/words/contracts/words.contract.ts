import { z } from 'zod'

export const wordSchema = z.object({
  id: z.uuid(),
  label: z.string(),
}).meta({
  title: 'WordSchema',
  description: 'Schema for a word',
})

export type WordResponse = z.infer<typeof wordSchema>

export const wordsSchema = z.array(wordSchema).meta({
  title: 'WordsSchema',
  description: 'Schema for a list of words',
})

export type WordsResponse = z.infer<typeof wordsSchema>

export const getRandomWordsQuerySchema = z.object({
  count: z.coerce.number().int().positive().min(1).max(400),
}).meta({
  title: 'GetRandomWordsQuerySchema',
  description: 'Query parameters for getting random words',
})

export type GetRandomWordsQuery = z.infer<typeof getRandomWordsQuerySchema>
