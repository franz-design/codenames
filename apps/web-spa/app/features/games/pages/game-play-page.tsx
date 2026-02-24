import { toast } from '@codenames/ui/components/primitives/sonner'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { GameLobbyView } from '../components/game-lobby-view'
import { GamePlayView } from '../components/game-play-view'
import {
  createGamesApiClient,
  useGameSession,
  useGameWebSocket,
} from '../index'

export default function GamePlayPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { playerName, hasSession, playerId, clearSession } = useGameSession()
  const { gameState: wsGameState, isConnected, error } = useGameWebSocket({
    gameId: gameId ?? null,
    enabled: Boolean(gameId) && hasSession,
  })

  const { data: fetchedState, isFetching } = useQuery({
    queryKey: ['gameState', gameId],
    queryFn: () => {
      if (!gameId || !playerId)
        throw new Error('Missing gameId or playerId')
      return createGamesApiClient(playerId).getGameState(gameId)
    },
    enabled: Boolean(gameId) && hasSession && Boolean(playerId) && !wsGameState,
  })

  const gameState = wsGameState ?? fetchedState ?? null
  const isLoading = !gameState && (isFetching || isConnected)

  const api = createGamesApiClient(playerId ?? '')
  const { mutate: leaveGame, isPending: isLeaving } = useMutation({
    mutationFn: () => api.leaveGame(gameId!),
    onSuccess: () => {
      clearSession()
      navigate('/')
    },
  })

  const { mutate: giveClue, isPending: isCluePending } = useMutation({
    mutationFn: ({ word, number }: { word: string, number: number }) =>
      api.giveClue(gameId!, word, number),
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Impossible d\'envoyer l\'indice',
      )
    },
  })

  useEffect(() => {
    if (!gameState || !playerId)
      return
    const isPlayerInGame = gameState.players.some(p => p.id === playerId)
    if (!isPlayerInGame) {
      clearSession()
      toast.info('Vous avez été éjecté du lobby')
      navigate('/')
    }
  }, [gameState, playerId, clearSession, navigate])

  if (!gameId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">Partie introuvable</p>
      </main>
    )
  }

  if (!hasSession) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">Vous devez rejoindre cette partie</p>
        <Link to={`/games/${gameId}/join`} className="mt-4 text-sm underline hover:no-underline">
          Rejoindre la partie
        </Link>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">
          Erreur de connexion :
          {error.message}
        </p>
      </main>
    )
  }

  if (!gameState) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">
          {isLoading ? 'Chargement...' : 'Connexion en cours...'}
        </p>
      </main>
    )
  }

  if (gameState.status === 'LOBBY') {
    return <GameLobbyView gameId={gameId} gameState={gameState} />
  }

  return (
    <GamePlayView
      gameState={gameState}
      playerId={playerId ?? ''}
      playerName={playerName}
      isConnected={isConnected}
      onLeaveGame={() => leaveGame()}
      isLeaving={isLeaving}
      onGiveClue={(word, number) => giveClue({ word, number })}
      isCluePending={isCluePending}
    />
  )
}
