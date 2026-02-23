import { Module } from '@nestjs/common'
import { WordsModule } from '../words/words.module'
import { GamesController } from './games.controller'
import { GamesGateway } from './games.gateway'
import { GamesService } from './games.service'

@Module({
  controllers: [GamesController],
  providers: [GamesService, GamesGateway],
  imports: [WordsModule],
  exports: [GamesService],
})
export class GamesModule {}
