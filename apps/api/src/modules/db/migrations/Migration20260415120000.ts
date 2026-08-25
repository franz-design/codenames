import { Migration } from '@mikro-orm/migrations'

export class Migration20260415120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "word_category" ("id" uuid not null default gen_random_uuid(), "slug" varchar(255) not null, "name" varchar(255) not null, constraint "word_category_pkey" primary key ("id"));`,
    )
    this.addSql(
      `alter table "word_category" add constraint "word_category_slug_unique" unique ("slug");`,
    )

    this.addSql(
      `insert into "word_category" ("id", "slug", "name") values (gen_random_uuid(), 'base', 'Mots de base');`,
    )
    this.addSql(
      `insert into "word_category" ("id", "slug", "name") values (gen_random_uuid(), 'music-artists-fr', 'Artistes musicaux francophones');`,
    )
    this.addSql(
      `insert into "word_category" ("id", "slug", "name") values (gen_random_uuid(), 'music-artists-intl', 'Artistes musicaux internationaux');`,
    )
    this.addSql(
      `insert into "word_category" ("id", "slug", "name") values (gen_random_uuid(), 'films-series', 'Films et séries');`,
    )

    this.addSql(`alter table "word" add column "category_id" uuid null;`)
    this.addSql(
      `update "word" set "category_id" = (select "id" from "word_category" where "slug" = 'base' limit 1) where "category_id" is null;`,
    )
    this.addSql(`alter table "word" alter column "category_id" set not null;`)
    this.addSql(
      `alter table "word" add constraint "word_category_id_foreign" foreign key ("category_id") references "word_category" ("id") on update cascade;`,
    )
    this.addSql(
      `create index "word_category_id_index" on "word" ("category_id");`,
    )
    this.addSql(
      `alter table "word" add constraint "word_category_id_label_unique" unique ("category_id", "label");`,
    )
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "word" drop constraint "word_category_id_label_unique";`)
    this.addSql(`alter table "word" drop constraint "word_category_id_foreign";`)
    this.addSql(`drop index "word_category_id_index";`)
    this.addSql(`alter table "word" drop column "category_id";`)
    this.addSql(`drop table if exists "word_category" cascade;`)
  }
}
