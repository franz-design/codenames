import type { Socket } from 'socket.io-client'
import type { GameState } from '../types'
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { io } from 'socket.io-client'

const GAME_JOIN_EVENT = 'game:join'
const GAME_STATE_EVENT = 'game:state'

export interface GameWebSocketSnapshot {
  gameState: GameState | null
  isConnected: boolean
  error: Error | null
}

const EMPTY_SNAPSHOT: GameWebSocketSnapshot = {
  gameState: null,
  isConnected: false,
  error: null,
}

function getSocketServerUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL
  const wsUrl = import.meta.env.VITE_WS_URL
  if (wsUrl)
    return wsUrl
  if (apiUrl) {
    const url = new URL(apiUrl)
    return `${url.protocol}//${url.host}`
  }
  throw new Error('VITE_API_URL or VITE_WS_URL is not defined')
}

interface GameStore {
  socket: Socket | null
  snapshot: GameWebSocketSnapshot
  listeners: Set<() => void>
  _disconnectTimeout?: ReturnType<typeof setTimeout>
}

const stores = new Map<string, GameStore>()

function notifyListeners(store: GameStore): void {
  store.listeners.forEach(listener => listener())
}

function createStore(gameId: string): GameStore {
  let socket: Socket
  const snapshot: GameWebSocketSnapshot = { ...EMPTY_SNAPSHOT }
  const listeners = new Set<() => void>()

  try {
    const serverUrl = getSocketServerUrl()
    socket = io(`${serverUrl}/games`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })
  }
  catch (err) {
    snapshot.error = err instanceof Error ? err : new Error(String(err))
    return { socket: null, snapshot, listeners }
  }

  const store: GameStore = {
    socket,
    snapshot,
    listeners,
  }

  socket.on('connect', () => {
    store.snapshot = {
      ...store.snapshot,
      isConnected: true,
      error: null,
    }
    socket.emit(GAME_JOIN_EVENT, gameId)
    notifyListeners(store)
  })

  socket.on('disconnect', (reason: string) => {
    store.snapshot = {
      ...store.snapshot,
      isConnected: false,
      error: reason === 'io server disconnect' ? new Error('Disconnected by server') : null,
    }
    notifyListeners(store)
  })

  socket.on(GAME_STATE_EVENT, (state: GameState) => {
    store.snapshot = {
      ...store.snapshot,
      gameState: state,
    }
    notifyListeners(store)
  })

  socket.on('connect_error', (err: Error) => {
    store.snapshot = {
      ...store.snapshot,
      error: err,
    }
    notifyListeners(store)
  })

  if (socket.connected) {
    store.snapshot = {
      ...store.snapshot,
      isConnected: true,
    }
    socket.emit(GAME_JOIN_EVENT, gameId)
  }

  return store
}

function getOrCreateStore(gameId: string): GameStore {
  let store = stores.get(gameId)
  if (!store) {
    store = createStore(gameId)
    stores.set(gameId, store)
  }
  return store
}

const DISCONNECT_DELAY_MS = 500

function scheduleDisconnect(store: GameStore, gameId: string): void {
  if (store._disconnectTimeout !== undefined)
    clearTimeout(store._disconnectTimeout)
  store._disconnectTimeout = setTimeout(() => {
    store._disconnectTimeout = undefined
    if (store.listeners.size === 0 && store.socket) {
      store.socket.disconnect()
      stores.delete(gameId)
    }
  }, DISCONNECT_DELAY_MS)
}

function cancelScheduledDisconnect(store: GameStore): void {
  if (store._disconnectTimeout !== undefined) {
    clearTimeout(store._disconnectTimeout)
    store._disconnectTimeout = undefined
  }
}

function subscribeToStore(callback: () => void, gameId: string | null, enabled: boolean): () => void {
  if (!enabled || !gameId) {
    return () => {}
  }

  const store = getOrCreateStore(gameId)
  cancelScheduledDisconnect(store)
  store.listeners.add(callback)

  return () => {
    store.listeners.delete(callback)
    if (store.listeners.size === 0) {
      scheduleDisconnect(store, gameId)
    }
  }
}

function getStoreSnapshot(gameId: string | null, enabled: boolean): GameWebSocketSnapshot {
  if (!enabled || !gameId) {
    return EMPTY_SNAPSHOT
  }
  const store = stores.get(gameId)
  if (!store) {
    return EMPTY_SNAPSHOT
  }
  return store.snapshot
}

export interface UseGameWebSocketOptions {
  gameId: string | null
  onGameState?: (state: GameState) => void
  enabled?: boolean
}

export interface UseGameWebSocketResult {
  gameState: GameState | null
  isConnected: boolean
  error: Error | null
}

export function useGameWebSocket({
  gameId,
  onGameState,
  enabled = true,
}: UseGameWebSocketOptions): UseGameWebSocketResult {
  const subscribe = useCallback(
    (callback: () => void) => subscribeToStore(callback, gameId, enabled),
    [gameId, enabled],
  )

  const getSnapshot = useCallback(
    () => getStoreSnapshot(gameId, enabled),
    [gameId, enabled],
  )

  const getServerSnapshot = useCallback(() => EMPTY_SNAPSHOT, [])

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const onGameStateRef = useRef(onGameState)
  onGameStateRef.current = onGameState

  useEffect(() => {
    if (snapshot.gameState) {
      onGameStateRef.current?.(snapshot.gameState)
    }
  }, [snapshot.gameState])

  return {
    gameState: snapshot.gameState,
    isConnected: snapshot.isConnected,
    error: snapshot.error,
  }
}
