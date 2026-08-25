import {
  customWordQuota,
  expandToPersistedCategorySlugs,
  mergeWordLabels,
  normalizeCustomWords,
  resolveDrawCategorySlugs,
  sampleBiasedWordLabels,
  sampleUniqueLabels,
} from './draw-words.logic'
import { WORD_CATEGORY_SLUG } from './word-category.entity'

describe('draw-words.logic', () => {
  describe('normalizeCustomWords', () => {
    it('should trim, drop empties, and dedupe case-insensitively', () => {
      const actual = normalizeCustomWords(['  Chat ', '', 'chat', 'Chien', '  '])

      expect(actual).toEqual(['Chat', 'Chien'])
    })
  })

  describe('resolveDrawCategorySlugs', () => {
    it('should use provided categorySlugs when non-empty', () => {
      const actual = resolveDrawCategorySlugs({
        categorySlug: WORD_CATEGORY_SLUG.BASE,
        categorySlugs: [WORD_CATEGORY_SLUG.FILMS_SERIES, WORD_CATEGORY_SLUG.MUSIC_ARTISTS_FR],
      })

      expect(actual).toEqual([
        WORD_CATEGORY_SLUG.FILMS_SERIES,
        WORD_CATEGORY_SLUG.MUSIC_ARTISTS_FR,
      ])
    })

    it('should mix custom-only words with the base list', () => {
      const actual = resolveDrawCategorySlugs({})

      expect(actual).toEqual([WORD_CATEGORY_SLUG.BASE])
    })

    it('should keep a single categorySlug when no custom slugs are sent', () => {
      const actual = resolveDrawCategorySlugs({
        categorySlug: WORD_CATEGORY_SLUG.FILMS_SERIES,
      })

      expect(actual).toEqual([WORD_CATEGORY_SLUG.FILMS_SERIES])
    })
  })

  describe('expandToPersistedCategorySlugs', () => {
    it('should expand the virtual mixed artist pack into FR and intl', () => {
      const actual = expandToPersistedCategorySlugs([WORD_CATEGORY_SLUG.MUSIC_ARTISTS_MIXED])

      expect(actual).toEqual([
        WORD_CATEGORY_SLUG.MUSIC_ARTISTS_FR,
        WORD_CATEGORY_SLUG.MUSIC_ARTISTS_INTL,
      ])
    })
  })

  describe('mergeWordLabels', () => {
    it('should keep custom spelling when it collides with a category word', () => {
      const actual = mergeWordLabels(['Spotify'], ['spotify', 'Radio'])

      expect(actual).toEqual(['Spotify', 'Radio'])
    })
  })

  describe('customWordQuota', () => {
    it('should reserve 60% when fewer than 10 custom words', () => {
      expect(customWordQuota(3, 25)).toBe(2)
      expect(customWordQuota(9, 25)).toBe(5)
    })

    it('should reserve 40% when there are 10 to 29 custom words', () => {
      expect(customWordQuota(10, 25)).toBe(4)
      expect(customWordQuota(25, 25)).toBe(10)
    })

    it('should reserve 30% when there are 30 or more custom words', () => {
      expect(customWordQuota(40, 25)).toBe(12)
    })

    it('should keep at least one custom word and never exceed the grid size', () => {
      expect(customWordQuota(1, 25)).toBe(1)
      expect(customWordQuota(100, 25)).toBe(25)
    })

    it('should reserve nothing when there are no custom words', () => {
      expect(customWordQuota(0, 25)).toBe(0)
    })
  })

  describe('sampleBiasedWordLabels', () => {
    it('should reserve the custom quota then fill from the category list', () => {
      const customWords = ['C1', 'C2', 'C3']
      const categoryLabels = Array.from({ length: 30 }, (_, i) => `Cat${i}`)

      const actual = sampleBiasedWordLabels({
        customWords,
        categoryLabels,
        count: 25,
      })

      expect(actual).not.toBeNull()
      expect(actual).toHaveLength(25)
      expect(actual?.filter(label => customWords.includes(label))).toHaveLength(2)
      expect(actual?.filter(label => label.startsWith('Cat'))).toHaveLength(23)
    })

    it('should sample only from the category list when there are no custom words', () => {
      const categoryLabels = Array.from({ length: 30 }, (_, i) => `Cat${i}`)

      const actual = sampleBiasedWordLabels({
        customWords: [],
        categoryLabels,
        count: 25,
      })

      expect(actual).toHaveLength(25)
      expect(actual?.every(label => label.startsWith('Cat'))).toBe(true)
    })
  })

  describe('sampleUniqueLabels', () => {
    it('should return null when the pool is smaller than requested', () => {
      expect(sampleUniqueLabels(['a', 'b'], 3)).toBeNull()
    })

    it('should return the requested count of unique labels from the pool', () => {
      const pool = ['a', 'b', 'c', 'd']
      const actual = sampleUniqueLabels(pool, 3)

      expect(actual).not.toBeNull()
      expect(actual).toHaveLength(3)
      expect(new Set(actual).size).toBe(3)
      expect(actual?.every(label => pool.includes(label))).toBe(true)
    })
  })
})
