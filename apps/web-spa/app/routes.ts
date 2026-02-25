import type { RouteConfig } from '@react-router/dev/routes'
import { index, route } from '@react-router/dev/routes'

export default [
  index('features/games/pages/game-home-page.tsx'),
  route('games/new', 'features/games/pages/game-create-page.tsx'),
  route('games/join', 'features/games/pages/game-join-page.tsx'),
  route('games/:gameId/join', 'features/games/pages/game-join-by-link-page.tsx'),
  route('games/:gameId', 'features/games/pages/game-play-page.tsx'),
] satisfies RouteConfig
