export type Side = 'red' | 'blue'

export const GAME_WORD_PACK_SLUG = {
  BASE: 'base',
  MUSIC_ARTISTS_FR: 'music-artists-fr',
  MUSIC_ARTISTS_INTL: 'music-artists-intl',
  MUSIC_ARTISTS_MIXED: 'music-artists-mixed',
  FILMS_SERIES: 'films-series',
} as const

export type GameWordPackSlug = (typeof GAME_WORD_PACK_SLUG)[keyof typeof GAME_WORD_PACK_SLUG]

export interface GameWordPackOption {
  slug: GameWordPackSlug
  label: string
}

export const GAME_WORD_PACK_OPTIONS: GameWordPackOption[] = [
  { slug: GAME_WORD_PACK_SLUG.BASE, label: 'Mots de base' },
  { slug: GAME_WORD_PACK_SLUG.MUSIC_ARTISTS_FR, label: 'Artistes musicaux (FR)' },
  { slug: GAME_WORD_PACK_SLUG.MUSIC_ARTISTS_INTL, label: 'Artistes musicaux (internationaux)' },
  { slug: GAME_WORD_PACK_SLUG.MUSIC_ARTISTS_MIXED, label: 'Artistes FR + internationaux (mélange)' },
  { slug: GAME_WORD_PACK_SLUG.FILMS_SERIES, label: 'Films et séries' },
]

export type CardType = 'neutral' | 'red' | 'blue' | 'black'

export const CLUE_NUMBER_INFINITY = 999

export interface GameStatePlayer {
  id: string
  name: string
  side: Side | null
  isSpy?: boolean
}

export interface RevealedWord {
  wordIndex: number
  cardType: CardType
}

export interface GameTimerSettings {
  isEnabled: boolean
  durationSeconds: number
}

export interface RoundState {
  id: string
  words: string[]
  results?: CardType[]
  order: number
  currentTurn: Side
  currentClue: { word: string, number: number } | null
  guessesRemaining: number
  revealedWords: RevealedWord[]
  /** Objectif : nombre total de mots équipe sur la grille (fourni par l’API) */
  wordsTotalBySide: { red: number, blue: number }
  /** Mots équipe encore non trouvés */
  wordsRemainingBySide: { red: number, blue: number }
  highlights: Record<string, { playerId: string, playerName: string }[]>
  turnStartedAt?: string | null
}

export interface GameState {
  status: 'LOBBY' | 'PLAYING' | 'FINISHED'
  players: GameStatePlayer[]
  currentRound: RoundState | null
  winningSide: Side | null
  losingSide: Side | null
  timerSettings?: GameTimerSettings | null
}

export interface Game {
  id: string
  creatorPseudo: string
  isPublic: boolean
  maxPlayers: number
  createdAt: string
}

export interface CreateGameResponse {
  game: Game
  creatorToken: string
  playerId: string
  gameState: GameState
}

export interface JoinGameResponse {
  gameState: GameState
  playerId: string
}

export interface PublicGame {
  id: string
  creatorPseudo: string
  status: 'LOBBY' | 'PLAYING'
  currentPlayersCount: number
  maxPlayers: number
  createdAt: string
}

export interface TimelineItem {
  id: string
  type: 'event' | 'chat'
  eventType?: string
  payload: Record<string, unknown>
  triggeredBy: string | null
  playerName?: string
  createdAt: string
  roundId?: string | null
}

export interface TimelineResponse {
  data: TimelineItem[]
  meta: {
    itemCount: number
    pageSize: number
    offset: number
    hasMore: boolean
  }
}
