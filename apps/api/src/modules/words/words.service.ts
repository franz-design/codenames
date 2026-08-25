import { randomUUID } from 'node:crypto'
import { EntityManager } from '@mikro-orm/core'
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { GetRandomWordsInput, WordResponse } from './contracts/words.contract'
import {
  expandToPersistedCategorySlugs,
  normalizeCustomWords,
  resolveDrawCategorySlugs,
  sampleBiasedWordLabels,
} from './draw-words.logic'
import { WordCategory } from './word-category.entity'
import { Word } from './words.entity'

@Injectable()
export class WordsService {
  constructor(private readonly em: EntityManager) {}

  async getRandomWords(query: GetRandomWordsInput): Promise<WordResponse[]> {
    const customWords = normalizeCustomWords(query.customWords ?? [])
    const slugs = resolveDrawCategorySlugs({
      categorySlug: query.categorySlug,
      categorySlugs: query.categorySlugs,
    })
    const persistedSlugs = expandToPersistedCategorySlugs(slugs)

    const categories = await this.em.find(WordCategory, { slug: { $in: persistedSlugs } })
    if (categories.length !== persistedSlugs.length) {
      const found = new Set(categories.map(category => category.slug))
      const missingSlug = persistedSlugs.find(slug => !found.has(slug))
      throw new NotFoundException(`Word category not found: ${missingSlug ?? persistedSlugs[0]}`)
    }

    const dbWords = await this.em.find(Word, { category: { $in: categories } }, {
      populate: ['category'],
    })

    const picked = sampleBiasedWordLabels({
      customWords,
      categoryLabels: dbWords.map(word => word.label),
      count: query.count,
    })
    if (!picked)
      throw new BadRequestException('Not enough unique words in the selected pool')

    const dbByNormalizedLabel = new Map(
      dbWords.map(word => [word.label.toLocaleLowerCase('fr-FR'), word]),
    )

    return picked.map((label) => {
      const dbWord = dbByNormalizedLabel.get(label.toLocaleLowerCase('fr-FR'))
      if (dbWord) {
        return {
          id: dbWord.id,
          label,
          category: {
            slug: dbWord.category.slug,
            name: dbWord.category.name,
          },
        }
      }

      return {
        id: randomUUID(),
        label,
        category: {
          slug: 'custom',
          name: 'Custom',
        },
      }
    })
  }
}
