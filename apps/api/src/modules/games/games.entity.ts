import {
  Collection,
  Entity,
  Enum,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core'
import { User } from '../auth/auth.entity'
import { Round } from '../rounds/rounds.entity'

export enum Side {
  RED = 'red',
  BLUE = 'blue',
}

@Entity({ tableName: 'game' })
export class Game {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ nullable: true })
  timer?: number

  @ManyToOne(() => User, { fieldName: 'createdBy' })
  @Index()
  createdBy!: User

  @Property({ fieldName: 'createdAt' })
  createdAt: Date = new Date()

  @OneToMany(() => GamePlayer, gamePlayer => gamePlayer.game)
  players = new Collection<GamePlayer>(this)

  @OneToMany(() => Round, round => round.game)
  rounds = new Collection<Round>(this)
}

@Entity({ tableName: 'game_player' })
export class GamePlayer {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @ManyToOne(() => Game, { fieldName: 'gameId' })
  @Index()
  game!: Game

  @ManyToOne(() => User, { fieldName: 'playerId' })
  @Index()
  player!: User

  @Enum(() => Side)
  @Property({ nullable: true })
  side?: Side
}
