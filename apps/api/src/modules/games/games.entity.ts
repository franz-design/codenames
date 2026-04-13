import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core'

@Entity({ tableName: 'game' })
export class Game {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property()
  @Index()
  creatorPseudo!: string

  @Property()
  creatorToken!: string

  @Property({ default: false })
  isPublic: boolean = false

  @Property({ default: 8 })
  maxPlayers: number = 8

  @Property({ fieldName: 'createdAt' })
  createdAt: Date = new Date()
}
