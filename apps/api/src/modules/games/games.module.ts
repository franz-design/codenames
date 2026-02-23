import { Module } from '@nestjs/common'
import { RoundsModule } from '../rounds/rounds.module'
import { GamesController } from './games.controller'
import { GamesService } from './games.service'

@Module({
  controllers: [GamesController],
  providers: [GamesService],
  imports: [RoundsModule],
  exports: [GamesService],
})
export class GamesModule {}
