import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core'

export const WORD_CATEGORY_SLUG = {
  BASE: 'base',
  MUSIC_ARTISTS_FR: 'music-artists-fr',
  MUSIC_ARTISTS_INTL: 'music-artists-intl',
  /** Virtual pack: random words from FR + international artist lists (not a DB row). */
  MUSIC_ARTISTS_MIXED: 'music-artists-mixed',
} as const

export type WordCategorySlug = (typeof WORD_CATEGORY_SLUG)[keyof typeof WORD_CATEGORY_SLUG]

/** Slugs accepted when picking a word pack for a round (includes virtual mixed). */
export const ROUND_WORD_CATEGORY_SLUGS = [
  WORD_CATEGORY_SLUG.BASE,
  WORD_CATEGORY_SLUG.MUSIC_ARTISTS_FR,
  WORD_CATEGORY_SLUG.MUSIC_ARTISTS_INTL,
  WORD_CATEGORY_SLUG.MUSIC_ARTISTS_MIXED,
] as const

export type RoundWordCategorySlug = (typeof ROUND_WORD_CATEGORY_SLUGS)[number]

@Entity({ tableName: 'word_category' })
@Unique({ properties: ['slug'] })
export class WordCategory {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property()
  slug!: string

  @Property()
  name!: string
}
