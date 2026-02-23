import { EntityManager } from '@mikro-orm/core'
import { Injectable } from '@nestjs/common'
import { GetRandomWordsQuery, WordResponse } from './contracts/words.contract'
import { Word } from './words.entity'

@Injectable()
export class WordsService {
  constructor(private readonly em: EntityManager) {}

  async getRandomWords(query: GetRandomWordsQuery): Promise<WordResponse[]> {
    const connection = this.em.getConnection()
    const words = await connection.execute<Word[]>(
      `SELECT * FROM "word" ORDER BY RANDOM() LIMIT $1`,
      [query.count],
    )

    return words.map((word: Word) => ({
      id: word.id,
      label: word.label,
    }))
  }
}
