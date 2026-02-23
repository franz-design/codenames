import { EntityManager } from '@mikro-orm/core'
import { Seeder } from '@mikro-orm/seeder'
import { WordsSeeder } from './words.seeder'

/**
 * MinimalSeeder creates primarily the words table for the Codenames game
 */
export class MinimalSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await new WordsSeeder().run(em)
  }
}
