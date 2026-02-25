import type {
  CreateGameResponse,
  GameState,
  JoinGameResponse,
  TimelineResponse,
} from '../types'

function getBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL
  if (!url)
    throw new Error('VITE_API_URL is not defined')
  return url.replace(/\/$/, '')
}

interface GamesApiOptions {
  playerId?: string
}

function buildHeaders(options: GamesApiOptions): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (options.playerId)
    headers['X-Player-Id'] = options.playerId
  return headers
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text()
    let error: unknown
    try {
      error = JSON.parse(text)
    }
    catch {
      error = { message: text }
    }
    if (typeof error === 'object' && error !== null) {
      (error as Record<string, unknown>).status = response.status
    }
    throw error
  }
  if (response.status === 204)
    return undefined as T
  return response.json() as Promise<T>
}

export interface GamesApiClient {
  createGame: (pseudo: string) => Promise<CreateGameResponse>
  getGameState: (gameId: string) => Promise<GameState>
  joinGame: (gameId: string, pseudo: string) => Promise<JoinGameResponse>
  kickPlayer: (gameId: string, playerId: string, creatorToken: string) => Promise<GameState>
  designatePlayerAsSpy: (gameId: string, playerId: string, creatorToken: string) => Promise<GameState>
  leaveGame: (gameId: string) => Promise<GameState>
  chooseSide: (gameId: string, side: 'red' | 'blue') => Promise<GameState>
  designateSpy: (gameId: string) => Promise<GameState>
  startRound: (gameId: string, wordCount?: number) => Promise<GameState>
  giveClue: (gameId: string, word: string, number: number) => Promise<GameState>
  selectWord: (gameId: string, wordIndex: number) => Promise<GameState>
  highlightWord: (gameId: string, wordIndex: number) => Promise<GameState>
  unhighlightWord: (gameId: string, wordIndex: number) => Promise<GameState>
  passTurn: (gameId: string) => Promise<GameState>
  restartGame: (gameId: string) => Promise<GameState>
  sendChatMessage: (gameId: string, content: string) => Promise<void>
  getTimeline: (gameId: string, pageSize?: number, offset?: number, roundId?: string | null) => Promise<TimelineResponse>
}

export function createGamesApiClient(playerId: string): GamesApiClient {
  const baseUrl = getBaseUrl()
  const headers = (opts: GamesApiOptions = {}) =>
    buildHeaders({ ...opts, playerId })

  return {
    async createGame(pseudo: string) {
      const response = await fetch(`${baseUrl}/api/games`, {
        method: 'POST',
        headers: headers({}),
        body: JSON.stringify({ pseudo }),
        credentials: 'include',
      })
      return handleResponse<CreateGameResponse>(response)
    },

    async getGameState(gameId: string) {
      const response = await fetch(`${baseUrl}/api/games/${gameId}/state`, {
        method: 'GET',
        headers: headers({}),
        credentials: 'include',
      })
      return handleResponse<GameState>(response)
    },

    async joinGame(gameId: string, pseudo: string) {
      const response = await fetch(`${baseUrl}/api/games/${gameId}/join`, {
        method: 'POST',
        headers: headers({}),
        body: JSON.stringify({ pseudo }),
        credentials: 'include',
      })
      return handleResponse<JoinGameResponse>(response)
    },

    async kickPlayer(gameId: string, targetPlayerId: string, creatorToken: string) {
      const response = await fetch(
        `${baseUrl}/api/games/${gameId}/players/${targetPlayerId}`,
        {
          method: 'DELETE',
          headers: headers({}),
          body: JSON.stringify({ creatorToken }),
          credentials: 'include',
        },
      )
      return handleResponse<GameState>(response)
    },

    async designatePlayerAsSpy(gameId: string, targetPlayerId: string, creatorToken: string) {
      const response = await fetch(
        `${baseUrl}/api/games/${gameId}/players/${targetPlayerId}/spy`,
        {
          method: 'PATCH',
          headers: headers({}),
          body: JSON.stringify({ creatorToken }),
          credentials: 'include',
        },
      )
      return handleResponse<GameState>(response)
    },

    async leaveGame(gameId: string) {
      const response = await fetch(`${baseUrl}/api/games/${gameId}/leave`, {
        method: 'DELETE',
        headers: headers({}),
        credentials: 'include',
      })
      return handleResponse<GameState>(response)
    },

    async chooseSide(gameId: string, side: 'red' | 'blue') {
      const response = await fetch(
        `${baseUrl}/api/games/${gameId}/players/me/side`,
        {
          method: 'PATCH',
          headers: headers({}),
          body: JSON.stringify({ side }),
          credentials: 'include',
        },
      )
      return handleResponse<GameState>(response)
    },

    async designateSpy(gameId: string) {
      const response = await fetch(
        `${baseUrl}/api/games/${gameId}/players/me/spy`,
        {
          method: 'PATCH',
          headers: headers({}),
          credentials: 'include',
        },
      )
      return handleResponse<GameState>(response)
    },

    async startRound(gameId: string, wordCount?: number) {
      const response = await fetch(`${baseUrl}/api/games/${gameId}/rounds/start`, {
        method: 'POST',
        headers: headers({}),
        body: JSON.stringify(wordCount !== undefined ? { wordCount } : {}),
        credentials: 'include',
      })
      return handleResponse<GameState>(response)
    },

    async giveClue(gameId: string, word: string, number: number) {
      const response = await fetch(
        `${baseUrl}/api/games/${gameId}/rounds/current/clue`,
        {
          method: 'POST',
          headers: headers({}),
          body: JSON.stringify({ word, number }),
          credentials: 'include',
        },
      )
      return handleResponse<GameState>(response)
    },

    async selectWord(gameId: string, wordIndex: number) {
      const response = await fetch(
        `${baseUrl}/api/games/${gameId}/rounds/current/select`,
        {
          method: 'POST',
          headers: headers({}),
          body: JSON.stringify({ wordIndex }),
          credentials: 'include',
        },
      )
      return handleResponse<GameState>(response)
    },

    async highlightWord(gameId: string, wordIndex: number) {
      const response = await fetch(
        `${baseUrl}/api/games/${gameId}/rounds/current/highlight`,
        {
          method: 'POST',
          headers: headers({}),
          body: JSON.stringify({ wordIndex }),
          credentials: 'include',
        },
      )
      return handleResponse<GameState>(response)
    },

    async unhighlightWord(gameId: string, wordIndex: number) {
      const response = await fetch(
        `${baseUrl}/api/games/${gameId}/rounds/current/highlight/${wordIndex}`,
        {
          method: 'DELETE',
          headers: headers({}),
          credentials: 'include',
        },
      )
      return handleResponse<GameState>(response)
    },

    async passTurn(gameId: string) {
      const response = await fetch(
        `${baseUrl}/api/games/${gameId}/rounds/current/pass`,
        {
          method: 'POST',
          headers: headers({}),
          credentials: 'include',
        },
      )
      return handleResponse<GameState>(response)
    },

    async restartGame(gameId: string) {
      const response = await fetch(`${baseUrl}/api/games/${gameId}/restart`, {
        method: 'POST',
        headers: headers({}),
        credentials: 'include',
      })
      return handleResponse<GameState>(response)
    },

    async sendChatMessage(gameId: string, content: string) {
      const response = await fetch(`${baseUrl}/api/games/${gameId}/chat`, {
        method: 'POST',
        headers: headers({}),
        body: JSON.stringify({ content }),
        credentials: 'include',
      })
      return handleResponse<void>(response)
    },

    async getTimeline(gameId: string, pageSize = 100, offset = 0, roundId?: string | null) {
      const params = new URLSearchParams({ pageSize: String(pageSize), offset: String(offset) })
      if (roundId)
        params.set('roundId', roundId)
      const response = await fetch(`${baseUrl}/api/games/${gameId}/timeline?${params}`, {
        method: 'GET',
        headers: headers({}),
        credentials: 'include',
      })
      return handleResponse<TimelineResponse>(response)
    },
  }
}
