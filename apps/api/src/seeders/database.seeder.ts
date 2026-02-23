/* eslint-disable no-console */

import { Dictionary, EntityManager } from '@mikro-orm/core'
import { Seeder } from '@mikro-orm/seeder'
import { AuthSeeder } from './auth.seeder'
import { WordsSeeder } from './words.seeder'

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const context: Dictionary = {}

    // Run WordsSeeder first to create words
    await new WordsSeeder().run(em)
    console.info('WordsSeeder done')

    // Run AuthSeeder first to create users
    await new AuthSeeder().run(em, context)
    console.info('AuthSeeder done')
  }
}
