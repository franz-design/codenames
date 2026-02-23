import { Entity, PrimaryKey, Property } from '@mikro-orm/core'

@Entity({ tableName: 'word' })
export class Word {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property()
  label!: string
}
