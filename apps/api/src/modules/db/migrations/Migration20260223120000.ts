import { Migration } from '@mikro-orm/migrations'

export class Migration20260223120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "game" drop constraint "game_createdBy_foreign";`)
    this.addSql(`alter table "session" drop constraint "session_userId_foreign";`)
    this.addSql(`alter table "account" drop constraint "account_userId_foreign";`)

    this.addSql(`alter table "game" drop column "createdBy";`)
    this.addSql(`alter table "game" add column "creatorPseudo" varchar(255) not null default 'unknown';`)
    this.addSql(`alter table "game" add column "creatorToken" varchar(255) not null default '';`)
    this.addSql(`alter table "game" alter column "creatorPseudo" drop default;`)
    this.addSql(`alter table "game" alter column "creatorToken" drop default;`)

    this.addSql(`drop table if exists "session" cascade;`)
    this.addSql(`drop table if exists "account" cascade;`)
    this.addSql(`drop table if exists "verification" cascade;`)
    this.addSql(`drop table if exists "user" cascade;`)

    this.addSql(`create index "game_creatorPseudo_index" on "game" ("creatorPseudo");`)

    this.addSql(`alter table "game_event" drop constraint if exists "game_event_event_type_check";`)
    this.addSql(`alter table "game_event" add constraint "game_event_event_type_check" check ("event_type" in ('GAME_CREATED', 'PLAYER_JOINED', 'PLAYER_LEFT', 'PLAYER_KICKED', 'PLAYER_CHOSE_SIDE', 'PLAYER_DESIGNATED_SPY', 'GAME_FINISHED', 'GAME_RESTARTED', 'ROUND_STARTED', 'CLUE_GIVEN', 'WORD_SELECTED', 'WORD_HIGHLIGHTED', 'WORD_UNHIGHLIGHTED', 'TURN_PASSED'));`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "game_creatorPseudo_index";`)

    this.addSql(`create table "user" ("id" uuid not null default gen_random_uuid(), "name" varchar(255) not null, "email" varchar(255) not null, "emailVerified" boolean not null default false, "image" varchar(255) null, "createdAt" timestamptz not null, "updatedAt" timestamptz not null, constraint "user_pkey" primary key ("id"));`)
    this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`)
    this.addSql(`create table "session" ("id" uuid not null default gen_random_uuid(), "expiresAt" timestamptz not null, "token" varchar(255) not null, "createdAt" timestamptz not null, "updatedAt" timestamptz not null, "ipAddress" varchar(255) null, "userAgent" varchar(255) null, "userId" uuid not null, constraint "session_pkey" primary key ("id"));`)
    this.addSql(`alter table "session" add constraint "session_token_unique" unique ("token");`)
    this.addSql(`create table "account" ("id" uuid not null default gen_random_uuid(), "accountId" varchar(255) not null, "providerId" varchar(255) not null, "userId" uuid not null, "accessToken" varchar(255) null, "refreshToken" varchar(255) null, "idToken" varchar(255) null, "accessTokenExpiresAt" timestamptz null, "refreshTokenExpiresAt" timestamptz null, "scope" varchar(255) null, "password" varchar(255) null, "createdAt" timestamptz not null, "updatedAt" timestamptz not null, constraint "account_pkey" primary key ("id"));`)
    this.addSql(`create table "verification" ("id" uuid not null default gen_random_uuid(), "identifier" varchar(255) not null, "value" varchar(255) not null, "expiresAt" timestamptz not null, "createdAt" timestamptz not null, "updatedAt" timestamptz not null, constraint "verification_pkey" primary key ("id"));`)

    this.addSql(`alter table "game" drop column "creatorPseudo";`)
    this.addSql(`alter table "game" drop column "creatorToken";`)
    this.addSql(`alter table "game" add column "createdBy" uuid not null;`)

    this.addSql(`alter table "session" add constraint "session_userId_foreign" foreign key ("userId") references "user" ("id") on update cascade;`)
    this.addSql(`alter table "game" add constraint "game_createdBy_foreign" foreign key ("createdBy") references "user" ("id") on update cascade;`)
    this.addSql(`alter table "account" add constraint "account_userId_foreign" foreign key ("userId") references "user" ("id") on update cascade;`)
  }
}
