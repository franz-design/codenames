import { Entity, Index, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { User } from '../auth/auth.entity'

@Entity({ tableName: 'game' })
export class Game {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @ManyToOne(() => User, { fieldName: 'createdBy' })
  @Index()
  createdBy!: User

  @Property({ fieldName: 'createdAt' })
  createdAt: Date = new Date()
}
