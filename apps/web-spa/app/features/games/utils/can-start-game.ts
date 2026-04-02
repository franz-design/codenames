import type { GameState } from '../types'

export function canStartGame(gameState: GameState): boolean {
  const redPlayers = gameState.players.filter(p => p.side === 'red')
  const bluePlayers = gameState.players.filter(p => p.side === 'blue')
  const redSpy = redPlayers.some(p => p.isSpy)
  const blueSpy = bluePlayers.some(p => p.isSpy)

  return (
    redPlayers.length >= 1
    && bluePlayers.length >= 1
    && redSpy
    && blueSpy
  )
}
