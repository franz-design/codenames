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
import { Game } from '../games/games.entity'

export enum CardType {
  NEUTRAL = 'neutral',
  RED = 'red',
  BLUE = 'blue',
  BLACK = 'black',
}

export enum Role {
  SPY = 'spy',
  AGENT = 'agent',
}

export enum EventType {
  CARD_SELECTED = 'card_selected',
  CARD_ADD_HIGHLIGHT = 'card_add_highlight',
  CARD_REMOVE_HIGHLIGHT = 'card_remove_highlight',
}

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

  @OneToMany(() => RoundPlayerRole, roundPlayerRole => roundPlayerRole.round)
  playerRoles = new Collection<RoundPlayerRole>(this)

  @OneToMany(() => RoundEvent, roundEvent => roundEvent.round)
  events = new Collection<RoundEvent>(this)
}

@Entity({ tableName: 'round_player_roles' })
export class RoundPlayerRole {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @ManyToOne(() => Round, { fieldName: 'roundId' })
  @Index()
  round!: Round

  @ManyToOne(() => User, { fieldName: 'playerId' })
  @Index()
  player!: User

  @Enum(() => Role)
  role!: Role
}

@Entity({ tableName: 'round_events' })
export class RoundEvent {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @ManyToOne(() => Round, { fieldName: 'roundId' })
  @Index()
  round!: Round

  @ManyToOne(() => User, { fieldName: 'playerId' })
  @Index()
  player!: User

  @Enum(() => EventType)
  event!: EventType

  @Property()
  payload!: string

  @Property({ fieldName: 'createdAt' })
  createdAt: Date = new Date()
}
