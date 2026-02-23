import { TypedController, TypedRoute } from '@lonestone/nzoth/server'
import { Query } from '@nestjs/common'
import {
  getRandomWordsQuerySchema,
  wordsSchema,
} from './contracts/words.contract'
import { WordsService } from './words.service'

@TypedController('words', undefined, {
  tags: ['Words'],
})
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  @TypedRoute.Get('random', wordsSchema)
  async getRandomWords(
    @Query('count') count: string,
  ) {
    const query = getRandomWordsQuerySchema.parse({ count })
    return await this.wordsService.getRandomWords(query)
  }
}
