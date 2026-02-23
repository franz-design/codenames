import { EntityManager, raw } from '@mikro-orm/core'
import { Injectable } from '@nestjs/common'
import { GetRandomWordsQuery, WordResponse } from './contracts/words.contract'
import { Word } from './words.entity'

@Injectable()
export class WordsService {
  constructor(private readonly em: EntityManager) {}

  async getRandomWords(query: GetRandomWordsQuery): Promise<WordResponse[]> {
    const words = await this.em.find(Word, {}, {
      orderBy: { [raw('RANDOM()')]: 'ASC' },
      limit: query.count,
    })

    return words.map(word => ({
      id: word.id,
      label: word.label,
    }))
  }
}
