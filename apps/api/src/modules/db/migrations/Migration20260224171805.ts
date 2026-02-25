import { Migration } from '@mikro-orm/migrations';

export class Migration20260224171805 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "game" ("id" uuid not null default gen_random_uuid(), "creator_pseudo" varchar(255) not null, "creator_token" varchar(255) not null, "createdAt" timestamptz not null, constraint "game_pkey" primary key ("id"));`);
    this.addSql(`create index "game_creator_pseudo_index" on "game" ("creator_pseudo");`);

    this.addSql(`create table "round" ("id" uuid not null default gen_random_uuid(), "gameId" uuid not null, "order" int not null, "words" text[] not null, "results" text[] not null, "createdAt" timestamptz not null, constraint "round_pkey" primary key ("id"));`);
    this.addSql(`create index "round_gameId_index" on "round" ("gameId");`);

    this.addSql(`create table "game_event" ("id" uuid not null default gen_random_uuid(), "gameId" uuid not null, "roundId" uuid null, "event_type" text check ("event_type" in ('GAME_CREATED', 'PLAYER_JOINED', 'PLAYER_LEFT', 'PLAYER_CHOSE_SIDE', 'PLAYER_DESIGNATED_SPY', 'GAME_FINISHED', 'GAME_RESTARTED', 'ROUND_STARTED', 'CLUE_GIVEN', 'WORD_SELECTED', 'WORD_HIGHLIGHTED', 'WORD_UNHIGHLIGHTED', 'TURN_PASSED', 'PLAYER_KICKED', 'CHAT_MESSAGE')) not null, "payload" jsonb not null, "triggered_by" varchar(255) null, "createdAt" timestamptz not null, constraint "game_event_pkey" primary key ("id"));`);
    this.addSql(`create index "game_event_gameId_index" on "game_event" ("gameId");`);
    this.addSql(`create index "game_event_roundId_index" on "game_event" ("roundId");`);

    this.addSql(`create table "word" ("id" uuid not null default gen_random_uuid(), "label" varchar(255) not null, constraint "word_pkey" primary key ("id"));`);

    this.addSql(`alter table "round" add constraint "round_gameId_foreign" foreign key ("gameId") references "game" ("id") on update cascade;`);

    this.addSql(`alter table "game_event" add constraint "game_event_gameId_foreign" foreign key ("gameId") references "game" ("id") on update cascade;`);
    this.addSql(`alter table "game_event" add constraint "game_event_roundId_foreign" foreign key ("roundId") references "round" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "round" drop constraint "round_gameId_foreign";`);

    this.addSql(`alter table "game_event" drop constraint "game_event_gameId_foreign";`);

    this.addSql(`alter table "game_event" drop constraint "game_event_roundId_foreign";`);

    this.addSql(`drop table if exists "game" cascade;`);

    this.addSql(`drop table if exists "round" cascade;`);

    this.addSql(`drop table if exists "game_event" cascade;`);

    this.addSql(`drop table if exists "word" cascade;`);
  }

}
