import {
  Entity,
  Enum,
  Index,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core'
import { Round } from '../../rounds/rounds.entity'
import { GameEventType } from '../game-event.types.js'
import { Game } from '../games.entity'

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
  @Property()
  eventType!: GameEventType

  @Property({ type: 'json' })
  payload!: Record<string, unknown>

  @Property({ nullable: true })
  triggeredBy?: string | null

  @Property({ fieldName: 'createdAt' })
  createdAt: Date = new Date()
}
