import { MikroORM, RequestContext } from '@mikro-orm/core'
import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { GamesService } from './games.service'

/** 03:00 server time every day (6-field cron: second minute hour …) */
const STALE_GAMES_CRON = '0 0 3 * * *'

@Injectable()
export class StaleGamesCleanupScheduler {
  private readonly logger = new Logger(StaleGamesCleanupScheduler.name)

  constructor(
    private readonly orm: MikroORM,
    private readonly gamesService: GamesService,
  ) {}

  @Cron(STALE_GAMES_CRON, {
    disabled: process.env.NODE_ENV === 'test',
  })
  async handleStaleUnfinishedGames(): Promise<void> {
    try {
      await RequestContext.create(this.orm.em, async () => {
        const closed = await this.gamesService.expireStaleUnfinishedGames()
        if (closed > 0)
          this.logger.log(`Marked ${closed} stale unfinished game(s) as finished (24h+ since game creation)`)
      })
    }
    catch (err) {
      this.logger.error(
        `Stale games cleanup failed: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      )
    }
  }
}
