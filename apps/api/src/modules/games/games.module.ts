import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { WordsModule } from '../words/words.module'
import { GamesController } from './games.controller'
import { GamesGateway } from './games.gateway'
import { GamesService } from './games.service'

@Module({
  controllers: [GamesController],
  providers: [GamesService, GamesGateway],
  imports: [WordsModule, AuthModule],
  exports: [GamesService],
})
export class GamesModule {}
