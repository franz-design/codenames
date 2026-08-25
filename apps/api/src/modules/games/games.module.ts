import { Module } from '@nestjs/common'
import { WordsModule } from '../words/words.module'
import { GamesController } from './games.controller'
import { GamesGateway } from './games.gateway'
import { GamesService } from './games.service'
import { CreatorAuthGuard } from './guards/creator-auth.guard'
import { StaleGamesCleanupScheduler } from './stale-games-cleanup.scheduler'

@Module({
  controllers: [GamesController],
  providers: [GamesService, GamesGateway, CreatorAuthGuard, StaleGamesCleanupScheduler],
  imports: [WordsModule],
  exports: [GamesService],
})
export class GamesModule {}
