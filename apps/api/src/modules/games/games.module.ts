import { Module } from '@nestjs/common'
import { WordsModule } from '../words/words.module'
import { GamesController } from './games.controller'
import { GamesGateway } from './games.gateway'
import { CreatorAuthGuard } from './guards/creator-auth.guard'
import { GamesService } from './games.service'

@Module({
  controllers: [GamesController],
  providers: [GamesService, GamesGateway, CreatorAuthGuard],
  imports: [WordsModule],
  exports: [GamesService],
})
export class GamesModule {}
