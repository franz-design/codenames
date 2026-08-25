import { EntityManager, raw } from '@mikro-orm/core'
import { Injectable, NotFoundException } from '@nestjs/common'
import { GetRandomWordsQuery, WordResponse } from './contracts/words.contract'
import { WORD_CATEGORY_SLUG, WordCategory } from './word-category.entity'
import { Word } from './words.entity'

@Injectable()
export class WordsService {
  constructor(private readonly em: EntityManager) {}

  async getRandomWords(query: GetRandomWordsQuery): Promise<WordResponse[]> {
    const categorySlug = query.categorySlug ?? WORD_CATEGORY_SLUG.BASE

    if (categorySlug === WORD_CATEGORY_SLUG.MUSIC_ARTISTS_MIXED)
      return this.getRandomWordsFromMixedArtistCategories(query.count)

    const category = await this.em.findOne(WordCategory, { slug: categorySlug })
    if (!category)
      throw new NotFoundException(`Word category not found: ${categorySlug}`)

    const words = await this.em.find(Word, { category }, {
      populate: ['category'],
      orderBy: { [raw('RANDOM()')]: 'ASC' },
      limit: query.count,
    })

    return this.mapWordsToResponse(words)
  }

  private async getRandomWordsFromMixedArtistCategories(count: number): Promise<WordResponse[]> {
    const fr = await this.em.findOne(WordCategory, { slug: WORD_CATEGORY_SLUG.MUSIC_ARTISTS_FR })
    const intl = await this.em.findOne(WordCategory, { slug: WORD_CATEGORY_SLUG.MUSIC_ARTISTS_INTL })
    if (!fr || !intl) {
      throw new NotFoundException(
        'Word categories for mixed artist mode not found (music-artists-fr, music-artists-intl)',
      )
    }

    const words = await this.em.find(Word, { category: { $in: [fr, intl] } }, {
      populate: ['category'],
      orderBy: { [raw('RANDOM()')]: 'ASC' },
      limit: count,
    })

    return this.mapWordsToResponse(words)
  }

  private mapWordsToResponse(words: Word[]): WordResponse[] {
    return words.map(word => ({
      id: word.id,
      label: word.label,
      category: {
        slug: word.category.slug,
        name: word.category.name,
      },
    }))
  }
}
