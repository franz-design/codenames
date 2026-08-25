import { z } from 'zod'
import { ROUND_WORD_CATEGORY_SLUGS } from '../word-category.entity'

export const wordCategorySnippetSchema = z.object({
  slug: z.string(),
  name: z.string(),
}).meta({
  title: 'WordCategorySnippetSchema',
  description: 'Word list category attached to a word',
})

export const wordSchema = z.object({
  id: z.uuid(),
  label: z.string(),
  category: wordCategorySnippetSchema,
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
  categorySlug: z.enum(ROUND_WORD_CATEGORY_SLUGS).optional(),
}).meta({
  title: 'GetRandomWordsQuerySchema',
  description: 'Query parameters for getting random words',
})

export type GetRandomWordsQuery = z.infer<typeof getRandomWordsQuerySchema>
