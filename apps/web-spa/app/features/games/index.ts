export type { CardRevealAnimationConfig } from './card-reveal-animation-config'
export {
  DEFAULT_CARD_REVEAL_ANIMATION_CONFIG,
  mergeCardRevealAnimationConfig,
} from './card-reveal-animation-config'
export { PENDING_REDIRECT_KEY, useGameSession } from './hooks/use-game-session'
export type { GameSessionData, SetAdminSpectatorSessionInput, SetSessionInput } from './hooks/use-game-session'
export { useGameTimeline } from './hooks/use-game-timeline'
export type {
  UseGameTimelineOptions,
  UseGameTimelineResult,
} from './hooks/use-game-timeline'
export { useGameWebSocket } from './hooks/use-game-websocket'
export type {
  UseGameWebSocketOptions,
  UseGameWebSocketResult,
} from './hooks/use-game-websocket'
export type { NewlyRevealedItem, UseNewlyRevealedIndicesOptions } from './hooks/use-newly-revealed-indices'
export { useNewlyRevealedIndices } from './hooks/use-newly-revealed-indices'
export type {
  FilterTimelineOperativeLagOptions,
  OperativeRevealPresentationFields,
  UseOperativeRevealPresentationOptions,
  UseOperativeRevealPresentationResult,
} from './hooks/use-operative-reveal-presentation'
export {
  extractOperativePresentationFields,
  filterTimelineItemsForOperativeRevealLag,
  getWordIndexFromWordSelectedTimelineItem,
  hasUncommittedOperativeRevealLag,
  mergePresentationFieldsIntoRound,
  useOperativeRevealPresentation,
} from './hooks/use-operative-reveal-presentation'
export type {
  CardType,
  CreateGameResponse,
  Game,
  GameState,
  GameStatePlayer,
  GameTimerSettings,
  JoinGameResponse,
  RevealedWord,
  RoundState,
  Side,
  TimelineItem,
  TimelineResponse,
} from './types'
export {
  isAdminSpectatorClientConfigured,
  readAdminTokenFromLocalStorage,
} from './utils/admin-spectator-client'
export {
  adminUnwatchGame,
  adminWatchGame,
  createGamesApiClient,
  fetchAdminOngoingGames,
} from './utils/games-api'
export type { AdminOngoingGame, GamesApiClient } from './utils/games-api'
