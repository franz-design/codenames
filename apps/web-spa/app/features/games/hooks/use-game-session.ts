import { useCallback, useMemo, useSyncExternalStore } from 'react'

const STORAGE_KEYS = {
  playerId: 'codenames_playerId',
  creatorToken: 'codenames_creatorToken',
  gameId: 'codenames_gameId',
  playerName: 'codenames_playerName',
  pendingRedirect: 'codenames_pendingRedirect',
  isAdminSpectator: 'codenames_isAdminSpectator',
} as const

const SESSION_CHANGE_EVENT = 'codenames:game-session-changed'

export interface GameSessionData {
  playerId: string | null
  creatorToken: string | null
  gameId: string | null
  playerName: string | null
  isAdminSpectator: boolean
}

const EMPTY_SESSION_JSON = JSON.stringify({
  playerId: null,
  creatorToken: null,
  gameId: null,
  playerName: null,
  isAdminSpectator: false,
} satisfies GameSessionData)

function notifyGameSessionChanged(): void {
  if (typeof window === 'undefined')
    return
  window.dispatchEvent(new CustomEvent(SESSION_CHANGE_EVENT))
}

export const PENDING_REDIRECT_KEY = STORAGE_KEYS.pendingRedirect

function getStoredValue(key: string): string | null {
  if (typeof window === 'undefined')
    return null
  return sessionStorage.getItem(key)
}

function getSessionSnapshot(): GameSessionData {
  return {
    playerId: getStoredValue(STORAGE_KEYS.playerId),
    creatorToken: getStoredValue(STORAGE_KEYS.creatorToken),
    gameId: getStoredValue(STORAGE_KEYS.gameId),
    playerName: getStoredValue(STORAGE_KEYS.playerName),
    isAdminSpectator: getStoredValue(STORAGE_KEYS.isAdminSpectator) === '1',
  }
}

function getSessionSnapshotJson(): string {
  return JSON.stringify(getSessionSnapshot())
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined')
    return () => {}

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key?.startsWith('codenames_')
      && event.storageArea === sessionStorage
    ) {
      onStoreChange()
    }
  }
  const handleSessionChange = () => onStoreChange()
  window.addEventListener('storage', handleStorage)
  window.addEventListener(SESSION_CHANGE_EVENT, handleSessionChange)
  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(SESSION_CHANGE_EVENT, handleSessionChange)
  }
}

export interface SetSessionInput {
  playerId: string
  gameId: string
  playerName: string
  creatorToken?: string
}

export interface SetAdminSpectatorSessionInput {
  playerId: string
  gameId: string
}

export function useGameSession() {
  const snapshotJson = useSyncExternalStore(
    subscribe,
    getSessionSnapshotJson,
    () => EMPTY_SESSION_JSON,
  )

  const session = useMemo(
    () => JSON.parse(snapshotJson) as GameSessionData,
    [snapshotJson],
  )

  const setSession = useCallback((data: SetSessionInput) => {
    sessionStorage.setItem(STORAGE_KEYS.playerId, data.playerId)
    sessionStorage.setItem(STORAGE_KEYS.gameId, data.gameId)
    sessionStorage.setItem(STORAGE_KEYS.playerName, data.playerName)
    sessionStorage.removeItem(STORAGE_KEYS.isAdminSpectator)
    if (data.creatorToken)
      sessionStorage.setItem(STORAGE_KEYS.creatorToken, data.creatorToken)
    else
      sessionStorage.removeItem(STORAGE_KEYS.creatorToken)
    notifyGameSessionChanged()
  }, [])

  const setAdminSpectatorSession = useCallback((data: SetAdminSpectatorSessionInput) => {
    sessionStorage.setItem(STORAGE_KEYS.playerId, data.playerId)
    sessionStorage.setItem(STORAGE_KEYS.gameId, data.gameId)
    sessionStorage.setItem(STORAGE_KEYS.playerName, '')
    sessionStorage.removeItem(STORAGE_KEYS.creatorToken)
    sessionStorage.setItem(STORAGE_KEYS.isAdminSpectator, '1')
    notifyGameSessionChanged()
  }, [])

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEYS.playerId)
    sessionStorage.removeItem(STORAGE_KEYS.creatorToken)
    sessionStorage.removeItem(STORAGE_KEYS.gameId)
    sessionStorage.removeItem(STORAGE_KEYS.playerName)
    sessionStorage.removeItem(STORAGE_KEYS.isAdminSpectator)
    notifyGameSessionChanged()
  }, [])

  const isCreator = Boolean(session.creatorToken)
  const hasSession = Boolean(session.playerId && session.gameId)

  return {
    ...session,
    setSession,
    setAdminSpectatorSession,
    clearSession,
    isCreator,
    hasSession,
  }
}
