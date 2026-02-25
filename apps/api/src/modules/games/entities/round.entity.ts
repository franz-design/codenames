import type { CardType } from '../game-event.types'
import { Entity, Index, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { Game } from '../games.entity'

@Entity({ tableName: 'round' })
export class Round {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @ManyToOne(() => Game, { fieldName: 'gameId' })
  @Index()
  game!: Game

  @Property()
  order!: number

  @Property({ type: 'array' })
  words!: string[]

  @Property({ type: 'array' })
  results!: CardType[]

  @Property({ fieldName: 'createdAt' })
  createdAt: Date = new Date()
}
