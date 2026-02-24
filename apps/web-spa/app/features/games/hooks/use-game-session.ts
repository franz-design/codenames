import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEYS = {
  playerId: 'codenames_playerId',
  creatorToken: 'codenames_creatorToken',
  gameId: 'codenames_gameId',
  playerName: 'codenames_playerName',
} as const

export interface GameSessionData {
  playerId: string | null
  creatorToken: string | null
  gameId: string | null
  playerName: string | null
}

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
  }
}

export interface SetSessionInput {
  playerId: string
  gameId: string
  playerName: string
  creatorToken?: string
}

export function useGameSession() {
  const [session, setSessionState] = useState<GameSessionData>(getSessionSnapshot)

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (
        event.key?.startsWith('codenames_')
        && event.storageArea === sessionStorage
      ) {
        setSessionState(getSessionSnapshot())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const setSession = useCallback((data: SetSessionInput) => {
    sessionStorage.setItem(STORAGE_KEYS.playerId, data.playerId)
    sessionStorage.setItem(STORAGE_KEYS.gameId, data.gameId)
    sessionStorage.setItem(STORAGE_KEYS.playerName, data.playerName)
    if (data.creatorToken)
      sessionStorage.setItem(STORAGE_KEYS.creatorToken, data.creatorToken)
    else
      sessionStorage.removeItem(STORAGE_KEYS.creatorToken)
    setSessionState(getSessionSnapshot())
  }, [])

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEYS.playerId)
    sessionStorage.removeItem(STORAGE_KEYS.creatorToken)
    sessionStorage.removeItem(STORAGE_KEYS.gameId)
    sessionStorage.removeItem(STORAGE_KEYS.playerName)
    setSessionState(getSessionSnapshot())
  }, [])

  const isCreator = Boolean(session.creatorToken)
  const hasSession = Boolean(session.playerId && session.gameId)

  return {
    ...session,
    setSession,
    clearSession,
    isCreator,
    hasSession,
  }
}
