/* eslint-disable no-console */

import { EntityManager } from '@mikro-orm/core'
import { Seeder } from '@mikro-orm/seeder'
import { WordsSeeder } from './words.seeder'

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await new WordsSeeder().run(em)
    console.info('WordsSeeder done')
  }
}
