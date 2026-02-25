import type { Socket } from 'socket.io-client'
import type { GameState, TimelineItem } from '../types'
import { useCallback, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { io } from 'socket.io-client'

const GAME_JOIN_EVENT = 'game:join'
const GAME_STATE_EVENT = 'game:state'
const GAME_TIMELINE_ITEM_EVENT = 'game:timeline-item'

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
  timelineItemCallbacks: Set<(item: TimelineItem) => void>
  _disconnectTimeout?: ReturnType<typeof setTimeout>
}

const stores = new Map<string, GameStore>()

function notifyListeners(store: GameStore): void {
  store.listeners.forEach(listener => listener())
}

function emitGameJoin(socket: Socket, gameId: string, playerId: string | null): void {
  if (playerId)
    socket.emit(GAME_JOIN_EVENT, { gameId, playerId })
  else
    socket.emit(GAME_JOIN_EVENT, gameId)
}

function createStore(gameId: string, playerId: string | null): GameStore {
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
    return {
      socket: null,
      snapshot,
      listeners,
      timelineItemCallbacks: new Set(),
    }
  }

  const timelineItemCallbacks = new Set<(item: TimelineItem) => void>()

  const store: GameStore = {
    socket,
    snapshot,
    listeners,
    timelineItemCallbacks,
  }

  socket.on(GAME_TIMELINE_ITEM_EVENT, (item: TimelineItem) => {
    timelineItemCallbacks.forEach(cb => cb(item))
  })

  socket.on('connect', () => {
    store.snapshot = {
      ...store.snapshot,
      isConnected: true,
      error: null,
    }
    emitGameJoin(socket, gameId, playerId)
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
    emitGameJoin(socket, gameId, playerId)
  }

  return store
}

function getStoreKey(gameId: string, playerId: string | null): string {
  return playerId ? `${gameId}:${playerId}` : gameId
}

function getOrCreateStore(gameId: string, playerId: string | null): GameStore {
  const key = getStoreKey(gameId, playerId)
  let store = stores.get(key)
  if (!store) {
    store = createStore(gameId, playerId)
    stores.set(key, store)
  }
  return store
}

function subscribeToTimelineItem(
  gameId: string | null,
  playerId: string | null,
  callback: (item: TimelineItem) => void,
  enabled: boolean,
): () => void {
  if (!enabled || !gameId) {
    return () => {}
  }
  const store = getOrCreateStore(gameId, playerId)
  store.timelineItemCallbacks.add(callback)
  return () => {
    store.timelineItemCallbacks.delete(callback)
  }
}

const DISCONNECT_DELAY_MS = 500

function scheduleDisconnect(store: GameStore, storeKey: string): void {
  if (store._disconnectTimeout !== undefined)
    clearTimeout(store._disconnectTimeout)
  store._disconnectTimeout = setTimeout(() => {
    store._disconnectTimeout = undefined
    if (store.listeners.size === 0 && store.socket) {
      store.socket.disconnect()
      stores.delete(storeKey)
    }
  }, DISCONNECT_DELAY_MS)
}

function cancelScheduledDisconnect(store: GameStore): void {
  if (store._disconnectTimeout !== undefined) {
    clearTimeout(store._disconnectTimeout)
    store._disconnectTimeout = undefined
  }
}

function subscribeToStore(
  callback: () => void,
  gameId: string | null,
  playerId: string | null,
  enabled: boolean,
): () => void {
  if (!enabled || !gameId) {
    return () => {}
  }

  const store = getOrCreateStore(gameId, playerId)
  cancelScheduledDisconnect(store)
  store.listeners.add(callback)

  return () => {
    store.listeners.delete(callback)
    if (store.listeners.size === 0) {
      scheduleDisconnect(store, getStoreKey(gameId, playerId))
    }
  }
}

function getStoreSnapshot(
  gameId: string | null,
  playerId: string | null,
  enabled: boolean,
): GameWebSocketSnapshot {
  if (!enabled || !gameId) {
    return EMPTY_SNAPSHOT
  }
  const store = stores.get(getStoreKey(gameId, playerId))
  if (!store) {
    return EMPTY_SNAPSHOT
  }
  return store.snapshot
}

export interface UseGameWebSocketOptions {
  gameId: string | null
  playerId?: string | null
  onGameState?: (state: GameState) => void
  onTimelineItem?: (item: TimelineItem) => void
  enabled?: boolean
}

export interface UseGameWebSocketResult {
  gameState: GameState | null
  isConnected: boolean
  error: Error | null
}

export function useGameWebSocket({
  gameId,
  playerId = null,
  onGameState,
  onTimelineItem,
  enabled = true,
}: UseGameWebSocketOptions): UseGameWebSocketResult {
  const subscribe = useCallback(
    (callback: () => void) => subscribeToStore(callback, gameId, playerId ?? null, enabled),
    [gameId, playerId, enabled],
  )

  const getSnapshot = useCallback(
    () => getStoreSnapshot(gameId, playerId ?? null, enabled),
    [gameId, playerId, enabled],
  )

  const getServerSnapshot = useCallback(() => EMPTY_SNAPSHOT, [])

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const onGameStateRef = useRef(onGameState)
  onGameStateRef.current = onGameState

  const onTimelineItemRef = useRef(onTimelineItem)
  onTimelineItemRef.current = onTimelineItem

  useEffect(() => {
    if (snapshot.gameState) {
      onGameStateRef.current?.(snapshot.gameState)
    }
  }, [snapshot.gameState])

  useLayoutEffect(() => {
    if (!onTimelineItemRef.current || !enabled || !gameId)
      return () => {}
    return subscribeToTimelineItem(gameId, playerId ?? null, (item) => {
      onTimelineItemRef.current?.(item)
    }, enabled)
  }, [gameId, playerId, enabled])

  return {
    gameState: snapshot.gameState,
    isConnected: snapshot.isConnected,
    error: snapshot.error,
  }
}
