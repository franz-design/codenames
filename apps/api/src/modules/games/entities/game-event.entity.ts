import {
  Entity,
  Enum,
  Index,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core'
import { GameEventType } from '../game-event.types'
import { Game } from '../games.entity'
import { Round } from './round.entity'

@Entity({ tableName: 'game_event' })
export class GameEvent {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @ManyToOne(() => Game, { fieldName: 'gameId' })
  @Index()
  game!: Game

  @ManyToOne(() => Round, { fieldName: 'roundId', nullable: true })
  @Index()
  round?: Round

  @Enum(() => GameEventType)
  @Property({ fieldName: 'event_type' })
  eventType!: GameEventType

  @Property({ type: 'json' })
  payload!: Record<string, unknown>

  @Property({ fieldName: 'triggered_by', nullable: true })
  triggeredBy?: string | null

  @Property({ fieldName: 'createdAt' })
  createdAt: Date = new Date()
}
