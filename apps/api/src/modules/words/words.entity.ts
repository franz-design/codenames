import { Entity, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/core'
import { WordCategory } from './word-category.entity'

@Entity({ tableName: 'word' })
@Unique({ properties: ['category', 'label'] })
export class Word {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property()
  label!: string

  @ManyToOne(() => WordCategory)
  category!: WordCategory
}
