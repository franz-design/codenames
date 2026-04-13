import { Migration } from '@mikro-orm/migrations'

export class Migration20260413101000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "game" add column "is_public" boolean not null default false;`)
    this.addSql(`alter table "game" add column "max_players" int not null default 8;`)

    this.addSql(`alter table "game_event" drop constraint if exists "game_event_event_type_check";`)
    this.addSql(
      `alter table "game_event" add constraint "game_event_event_type_check" check ("event_type" in ('GAME_CREATED', 'GAME_TIMER_SETTINGS', 'PLAYER_JOINED', 'PLAYER_LEFT', 'PLAYER_CHOSE_SIDE', 'PLAYER_DESIGNATED_SPY', 'GAME_FINISHED', 'GAME_RESTARTED', 'ROUND_STARTED', 'CLUE_GIVEN', 'WORD_SELECTED', 'WORD_HIGHLIGHTED', 'WORD_UNHIGHLIGHTED', 'TURN_PASSED', 'PLAYER_KICKED', 'CHAT_MESSAGE'));`,
    )
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "game_event" drop constraint if exists "game_event_event_type_check";`)
    this.addSql(
      `alter table "game_event" add constraint "game_event_event_type_check" check ("event_type" in ('GAME_CREATED', 'GAME_TIMER_SETTINGS', 'PLAYER_JOINED', 'PLAYER_LEFT', 'PLAYER_CHOSE_SIDE', 'PLAYER_DESIGNATED_SPY', 'GAME_FINISHED', 'GAME_RESTARTED', 'ROUND_STARTED', 'CLUE_GIVEN', 'WORD_SELECTED', 'WORD_HIGHLIGHTED', 'WORD_UNHIGHLIGHTED', 'TURN_PASSED', 'PLAYER_KICKED', 'CHAT_MESSAGE'));`,
    )
    this.addSql(`alter table "game" drop column "is_public";`)
    this.addSql(`alter table "game" drop column "max_players";`)
  }
}
