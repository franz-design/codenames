import type { RoundWordCategorySlug } from './word-category.entity'
import { WORD_CATEGORY_SLUG } from './word-category.entity'

export const CUSTOM_WORD_MAX_LENGTH = 40
export const CUSTOM_WORDS_MAX_COUNT = 400

export interface ResolveDrawCategorySlugsInput {
  categorySlug?: RoundWordCategorySlug
  categorySlugs?: RoundWordCategorySlug[]
}

export function normalizeCustomWords(words: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const word of words) {
    const trimmed = word.trim()
    if (trimmed.length === 0)
      continue

    const key = trimmed.toLocaleLowerCase('fr-FR')
    if (seen.has(key))
      continue

    seen.add(key)
    normalized.push(trimmed)
  }

  return normalized
}

export function resolveDrawCategorySlugs(
  input: ResolveDrawCategorySlugsInput,
): RoundWordCategorySlug[] {
  if (input.categorySlugs && input.categorySlugs.length > 0)
    return [...new Set(input.categorySlugs)]

  if (input.categorySlug)
    return [input.categorySlug]

  return [WORD_CATEGORY_SLUG.BASE]
}

export function expandToPersistedCategorySlugs(
  slugs: RoundWordCategorySlug[],
): string[] {
  const expanded: string[] = []

  for (const slug of slugs) {
    if (slug === WORD_CATEGORY_SLUG.MUSIC_ARTISTS_MIXED) {
      expanded.push(
        WORD_CATEGORY_SLUG.MUSIC_ARTISTS_FR,
        WORD_CATEGORY_SLUG.MUSIC_ARTISTS_INTL,
      )
      continue
    }

    expanded.push(slug)
  }

  return [...new Set(expanded)]
}

export function mergeWordLabels(customWords: string[], categoryLabels: string[]): string[] {
  return normalizeCustomWords([...customWords, ...categoryLabels])
}

export function customWordQuota(customCount: number, gridSize: number): number {
  if (customCount <= 0)
    return 0

  const rate = customCount < 10 ? 0.6 : customCount < 30 ? 0.4 : 0.3
  return Math.min(gridSize, Math.max(1, Math.round(customCount * rate)))
}

export function sampleBiasedWordLabels(input: {
  customWords: string[]
  categoryLabels: string[]
  count: number
}): string[] | null {
  const customWords = normalizeCustomWords(input.customWords)
  const customKeys = new Set(customWords.map(word => word.toLocaleLowerCase('fr-FR')))
  const categoryLabels = normalizeCustomWords(input.categoryLabels)
    .filter(label => !customKeys.has(label.toLocaleLowerCase('fr-FR')))

  const reservedCount = Math.min(customWordQuota(customWords.length, input.count), customWords.length)
  const reserved = sampleUniqueLabels(customWords, reservedCount)
  if (!reserved)
    return null

  const leftoverCustom = customWords.filter(word => !reserved.includes(word))
  const remainingAfterReserve = input.count - reserved.length
  const categoryTake = Math.min(remainingAfterReserve, categoryLabels.length)
  const fromCategory = sampleUniqueLabels(categoryLabels, categoryTake)
  if (!fromCategory)
    return null

  const stillNeeded = input.count - reserved.length - fromCategory.length
  const leftoverTake = Math.min(stillNeeded, leftoverCustom.length)
  const fromLeftover = sampleUniqueLabels(leftoverCustom, leftoverTake)
  if (!fromLeftover)
    return null

  return sampleUniqueLabels([...reserved, ...fromCategory, ...fromLeftover], input.count)
}

export function sampleUniqueLabels(pool: string[], count: number): string[] | null {
  if (count === 0)
    return []

  if (pool.length < count)
    return null

  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = shuffled[i]
    const swap = shuffled[j]
    if (current === undefined || swap === undefined)
      continue
    shuffled[i] = swap
    shuffled[j] = current
  }

  return shuffled.slice(0, count)
}
