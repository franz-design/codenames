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

function getErrorStatus(err: unknown): number | undefined {
  if (typeof err === 'object' && err !== null) {
    const o = err as Record<string, unknown>
    if (typeof o.status === 'number')
      return o.status
    if (typeof o.statusCode === 'number')
      return o.statusCode
  }
  return undefined
}

export default function GamePlayPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { playerName, hasSession, playerId, clearSession, isCreator } = useGameSession()
  const { gameState: wsGameState, isConnected, error: wsError } = useGameWebSocket({
    gameId: gameId ?? null,
    enabled: Boolean(gameId) && hasSession,
  })

  const shouldFetchState = Boolean(gameId) && hasSession && Boolean(playerId)
  const { data: fetchedState, isFetching, error: fetchError } = useQuery({
    queryKey: ['gameState', gameId, playerId],
    queryFn: () => {
      if (!gameId || !playerId)
        throw new Error('Missing gameId or playerId')
      return createGamesApiClient(playerId).getGameState(gameId)
    },
    enabled: shouldFetchState && (!wsGameState || Boolean(wsError)),
    retry: (failureCount, error) => {
      const status = getErrorStatus(error)
      if (status === 401 || status === 404)
        return false
      return failureCount < 2
    },
  })

  const gameState = wsGameState ?? fetchedState ?? null
  const isLoading = !gameState && (isFetching || (isConnected && !wsError))
  const error = wsError ?? fetchError

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

  const { mutate: highlightWord, isPending: isHighlightPending } = useMutation({
    mutationFn: (wordIndex: number) => api.highlightWord(gameId!, wordIndex),
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Impossible de mettre en avant le mot',
      )
    },
  })

  const { mutate: unhighlightWord, isPending: isUnhighlightPending } = useMutation({
    mutationFn: (wordIndex: number) => api.unhighlightWord(gameId!, wordIndex),
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Impossible de retirer la mise en avant',
      )
    },
  })

  const { mutate: selectWord, isPending: isSelectPending } = useMutation({
    mutationFn: (wordIndex: number) => api.selectWord(gameId!, wordIndex),
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Impossible de sélectionner le mot',
      )
    },
  })

  const { mutate: passTurn, isPending: isPassPending } = useMutation({
    mutationFn: () => api.passTurn(gameId!),
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Impossible de passer le tour',
      )
    },
  })

  const { mutate: restartGame, isPending: isRestartPending } = useMutation({
    mutationFn: () => api.restartGame(gameId!),
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Impossible de démarrer une nouvelle partie',
      )
    },
  })

  const isOperativeActionPending
    = isHighlightPending || isUnhighlightPending || isSelectPending || isPassPending

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

  useEffect(() => {
    if (!fetchError || !playerId || !gameId)
      return
    if (getErrorStatus(fetchError) === 401) {
      clearSession()
      toast.error('Session expirée. Veuillez rejoindre la partie.')
      navigate(`/games/${gameId}/join`)
    }
  }, [fetchError, playerId, clearSession, navigate, gameId])

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

  if (error && !gameState) {
    const is404 = getErrorStatus(error) === 404
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="text-muted-foreground text-center">
          {is404
            ? 'Partie introuvable.'
            : `Erreur : ${error instanceof Error ? error.message : String(error)}`}
        </p>
        <Link
          to="/"
          className="mt-4 text-sm font-medium underline hover:no-underline"
        >
          Retour à l&apos;accueil
        </Link>
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
      isCreator={isCreator}
      onLeaveGame={() => leaveGame()}
      isLeaving={isLeaving}
      onGiveClue={(word, number) => giveClue({ word, number })}
      isCluePending={isCluePending}
      onHighlight={wordIndex => highlightWord(wordIndex)}
      onUnhighlight={wordIndex => unhighlightWord(wordIndex)}
      onSelect={wordIndex => selectWord(wordIndex)}
      onPass={() => passTurn()}
      onRestart={() => restartGame()}
      isOperativeActionPending={isOperativeActionPending}
      isRestartPending={isRestartPending}
    />
  )
}
