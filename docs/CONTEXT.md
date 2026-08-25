# Codenames domain

Vocabulary used in code, APIs, and product docs. Prefer these terms over near-synonyms.

## Language

**Game**:
A session players join, from lobby through finished (and optional restart). Identified by `gameId`.
_Avoid_: Match, room (except WebSocket room `game:{gameId}`)

**Round**:
One grid of words plus card colors. Created on start; clues, reveals, and turns are events on that round.
_Avoid_: Board as a persisted entity (the board is round `words` + `results`)

**Game state**:
Derived snapshot replayed from events (`LOBBY` | `PLAYING` | `FINISHED`). Not stored as a row of mutable fields.
_Avoid_: “Current game document” as source of truth

**Event**:
An immutable `GameEvent` (`eventType` + JSON `payload`). The event store is the source of truth.
_Avoid_: Command log, audit-only trail

**Player**:
Someone in the game, identified by `playerId` (UUID) and a display **pseudo**.
_Avoid_: User, account, member

**Creator / host**:
The player who created the game. Holds a secret `creatorToken` for host-only HTTP actions (kick, shuffle, designate spies, timer settings, assign a late joiner to a side).
_Avoid_: Admin (that word is reserved for spectator ops)

**Side**:
`red` or `blue`.
_Avoid_: Team color names other than red/blue

**Spymaster**:
The player on a side with `isSpy`. Sees card colors. Gives clues.
_Avoid_: Spy (except API paths that still say `spy`)

**Operative**:
A non-spymaster player. Sees words, not colors, until revealed. Highlights and selects cards.
_Avoid_: Agent in new copy (the UI may still say Agent)

**Card type**:
`red`, `blue`, `neutral` (bystander), `black` (assassin).
_Avoid_: Innocent / civilian as enum values (docs may say bystander)

**Clue**:
One word plus a number. Engine sets `guessesRemaining` to `number + 1`. The SPA treats `999` as ∞.
_Avoid_: Hint

**Highlight**:
Operative pre-selection of a word index; several players can highlight the same card.

**Word pack**:
A category slug used when drawing labels (`base`, artist packs, `films-series`, virtual `music-artists-mixed`).
_Avoid_: Dictionary, lexicon

**Custom word pool**:
Host-supplied labels sent when starting a round; stored on the client (`localStorage`), not as a server word list.

**Creator token**:
UUID returned only on create. Sent in the body of host-only routes.
_Avoid_: Session cookie, JWT for players

**Admin spectator**:
Optional ops mode (`ADMIN_SPECTATOR_TOKEN` / `VITE_ADMIN_TOKEN`). Watches a game without mutating it.
_Avoid_: Superuser player
