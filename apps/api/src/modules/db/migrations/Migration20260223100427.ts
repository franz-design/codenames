import { Migration } from '@mikro-orm/migrations';

export class Migration20260223100427 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "user" ("id" uuid not null default gen_random_uuid(), "name" varchar(255) not null, "email" varchar(255) not null, "emailVerified" boolean not null default false, "image" varchar(255) null, "createdAt" timestamptz not null, "updatedAt" timestamptz not null, constraint "user_pkey" primary key ("id"));`);
    this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`);

    this.addSql(`create table "session" ("id" uuid not null default gen_random_uuid(), "expiresAt" timestamptz not null, "token" varchar(255) not null, "createdAt" timestamptz not null, "updatedAt" timestamptz not null, "ipAddress" varchar(255) null, "userAgent" varchar(255) null, "userId" uuid not null, constraint "session_pkey" primary key ("id"));`);
    this.addSql(`alter table "session" add constraint "session_token_unique" unique ("token");`);

    this.addSql(`create table "game" ("id" uuid not null default gen_random_uuid(), "timer" int null, "createdBy" uuid not null, "createdAt" timestamptz not null, constraint "game_pkey" primary key ("id"));`);
    this.addSql(`create index "game_createdBy_index" on "game" ("createdBy");`);

    this.addSql(`create table "round" ("id" uuid not null default gen_random_uuid(), "gameId" uuid not null, "order" int not null, "words" text[] not null, "results" text[] not null, "createdAt" timestamptz not null, constraint "round_pkey" primary key ("id"));`);
    this.addSql(`create index "round_gameId_index" on "round" ("gameId");`);

    this.addSql(`create table "round_player_roles" ("id" uuid not null default gen_random_uuid(), "roundId" uuid not null, "playerId" uuid not null, "role" text check ("role" in ('spy', 'agent')) not null, constraint "round_player_roles_pkey" primary key ("id"));`);
    this.addSql(`create index "round_player_roles_roundId_index" on "round_player_roles" ("roundId");`);
    this.addSql(`create index "round_player_roles_playerId_index" on "round_player_roles" ("playerId");`);

    this.addSql(`create table "round_events" ("id" uuid not null default gen_random_uuid(), "roundId" uuid not null, "playerId" uuid not null, "event" text check ("event" in ('card_selected', 'card_add_highlight', 'card_remove_highlight')) not null, "payload" varchar(255) not null, "createdAt" timestamptz not null, constraint "round_events_pkey" primary key ("id"));`);
    this.addSql(`create index "round_events_roundId_index" on "round_events" ("roundId");`);
    this.addSql(`create index "round_events_playerId_index" on "round_events" ("playerId");`);

    this.addSql(`create table "game_player" ("id" uuid not null default gen_random_uuid(), "gameId" uuid not null, "playerId" uuid not null, "side" text check ("side" in ('red', 'blue')) null, constraint "game_player_pkey" primary key ("id"));`);
    this.addSql(`create index "game_player_gameId_index" on "game_player" ("gameId");`);
    this.addSql(`create index "game_player_playerId_index" on "game_player" ("playerId");`);

    this.addSql(`create table "game_event" ("id" uuid not null default gen_random_uuid(), "gameId" uuid not null, "roundId" uuid null, "event_type" text check ("event_type" in ('GAME_CREATED', 'PLAYER_JOINED', 'PLAYER_LEFT', 'PLAYER_CHOSE_SIDE', 'PLAYER_DESIGNATED_SPY', 'GAME_FINISHED', 'GAME_RESTARTED', 'ROUND_STARTED', 'CLUE_GIVEN', 'WORD_SELECTED', 'WORD_HIGHLIGHTED', 'WORD_UNHIGHLIGHTED', 'TURN_PASSED')) not null, "payload" jsonb not null, "triggered_by" varchar(255) null, "createdAt" timestamptz not null, constraint "game_event_pkey" primary key ("id"));`);
    this.addSql(`create index "game_event_gameId_index" on "game_event" ("gameId");`);
    this.addSql(`create index "game_event_roundId_index" on "game_event" ("roundId");`);

    this.addSql(`create table "account" ("id" uuid not null default gen_random_uuid(), "accountId" varchar(255) not null, "providerId" varchar(255) not null, "userId" uuid not null, "accessToken" varchar(255) null, "refreshToken" varchar(255) null, "idToken" varchar(255) null, "accessTokenExpiresAt" timestamptz null, "refreshTokenExpiresAt" timestamptz null, "scope" varchar(255) null, "password" varchar(255) null, "createdAt" timestamptz not null, "updatedAt" timestamptz not null, constraint "account_pkey" primary key ("id"));`);

    this.addSql(`create table "verification" ("id" uuid not null default gen_random_uuid(), "identifier" varchar(255) not null, "value" varchar(255) not null, "expiresAt" timestamptz not null, "createdAt" timestamptz not null, "updatedAt" timestamptz not null, constraint "verification_pkey" primary key ("id"));`);

    this.addSql(`create table "word" ("id" uuid not null default gen_random_uuid(), "label" varchar(255) not null, constraint "word_pkey" primary key ("id"));`);

    this.addSql(`alter table "session" add constraint "session_userId_foreign" foreign key ("userId") references "user" ("id") on update cascade;`);

    this.addSql(`alter table "game" add constraint "game_createdBy_foreign" foreign key ("createdBy") references "user" ("id") on update cascade;`);

    this.addSql(`alter table "round" add constraint "round_gameId_foreign" foreign key ("gameId") references "game" ("id") on update cascade;`);

    this.addSql(`alter table "round_player_roles" add constraint "round_player_roles_roundId_foreign" foreign key ("roundId") references "round" ("id") on update cascade;`);
    this.addSql(`alter table "round_player_roles" add constraint "round_player_roles_playerId_foreign" foreign key ("playerId") references "user" ("id") on update cascade;`);

    this.addSql(`alter table "round_events" add constraint "round_events_roundId_foreign" foreign key ("roundId") references "round" ("id") on update cascade;`);
    this.addSql(`alter table "round_events" add constraint "round_events_playerId_foreign" foreign key ("playerId") references "user" ("id") on update cascade;`);

    this.addSql(`alter table "game_player" add constraint "game_player_gameId_foreign" foreign key ("gameId") references "game" ("id") on update cascade;`);
    this.addSql(`alter table "game_player" add constraint "game_player_playerId_foreign" foreign key ("playerId") references "user" ("id") on update cascade;`);

    this.addSql(`alter table "game_event" add constraint "game_event_gameId_foreign" foreign key ("gameId") references "game" ("id") on update cascade;`);
    this.addSql(`alter table "game_event" add constraint "game_event_roundId_foreign" foreign key ("roundId") references "round" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "account" add constraint "account_userId_foreign" foreign key ("userId") references "user" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "session" drop constraint "session_userId_foreign";`);

    this.addSql(`alter table "game" drop constraint "game_createdBy_foreign";`);

    this.addSql(`alter table "round_player_roles" drop constraint "round_player_roles_playerId_foreign";`);

    this.addSql(`alter table "round_events" drop constraint "round_events_playerId_foreign";`);

    this.addSql(`alter table "game_player" drop constraint "game_player_playerId_foreign";`);

    this.addSql(`alter table "account" drop constraint "account_userId_foreign";`);

    this.addSql(`alter table "round" drop constraint "round_gameId_foreign";`);

    this.addSql(`alter table "game_player" drop constraint "game_player_gameId_foreign";`);

    this.addSql(`alter table "game_event" drop constraint "game_event_gameId_foreign";`);

    this.addSql(`alter table "round_player_roles" drop constraint "round_player_roles_roundId_foreign";`);

    this.addSql(`alter table "round_events" drop constraint "round_events_roundId_foreign";`);

    this.addSql(`alter table "game_event" drop constraint "game_event_roundId_foreign";`);

    this.addSql(`drop table if exists "user" cascade;`);

    this.addSql(`drop table if exists "session" cascade;`);

    this.addSql(`drop table if exists "game" cascade;`);

    this.addSql(`drop table if exists "round" cascade;`);

    this.addSql(`drop table if exists "round_player_roles" cascade;`);

    this.addSql(`drop table if exists "round_events" cascade;`);

    this.addSql(`drop table if exists "game_player" cascade;`);

    this.addSql(`drop table if exists "game_event" cascade;`);

    this.addSql(`drop table if exists "account" cascade;`);

    this.addSql(`drop table if exists "verification" cascade;`);

    this.addSql(`drop table if exists "word" cascade;`);
  }

}
