import { Button } from '@codenames/ui/components/primitives/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@codenames/ui/components/primitives/card'
import { toast } from '@codenames/ui/components/primitives/sonner'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import type { GameState, Side } from '../types'
import {
  createGamesApiClient,
  useGameSession,
} from '../index'
import { LobbyPlayersList } from './lobby-players-list'
import { SpyDesignation } from './spy-designation'
import { TeamSelector } from './team-selector'

interface GameLobbyViewProps {
  gameId: string
  gameState: GameState
}

function canStartGame(gameState: GameState): boolean {
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

export function GameLobbyView({ gameId, gameState }: GameLobbyViewProps) {
  const navigate = useNavigate()
  const { playerId, creatorToken, isCreator, clearSession } = useGameSession()
  const currentPlayer = gameState.players.find(p => p.id === playerId)
  const api = createGamesApiClient(playerId ?? '')

  const { mutate: chooseSide, isPending: isChoosingSide } = useMutation({
    mutationFn: (side: Side) => api.chooseSide(gameId, side),
  })

  const { mutate: designateSpy, isPending: isDesignatingSpy } = useMutation({
    mutationFn: () => api.designateSpy(gameId),
  })

  const { mutate: startRound, isPending: isStartingRound } = useMutation({
    mutationFn: () => api.startRound(gameId),
  })

  const { mutate: kickPlayer, isPending: isKicking } = useMutation({
    mutationFn: (targetPlayerId: string) => {
      if (!creatorToken)
        throw new Error('Creator token required')
      return api.kickPlayer(gameId, targetPlayerId, creatorToken)
    },
  })

  const { mutate: leaveGame, isPending: isLeaving } = useMutation({
    mutationFn: () => api.leaveGame(gameId),
    onSuccess: () => {
      clearSession()
      navigate('/')
    },
  })

  const readyToStart = canStartGame(gameState)
  const canStart = isCreator && readyToStart

  const handleCopyJoinLink = () => {
    const joinUrl = `${window.location.origin}/games/${gameId}/join`
    navigator.clipboard.writeText(joinUrl).then(
      () => toast.success('Lien copié dans le presse-papier'),
      () => toast.error('Impossible de copier le lien'),
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Lobby</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyJoinLink}
            >
              Copier le lien d&apos;invitation
            </Button>
            <span className="text-sm text-muted-foreground">
              {gameState.players.length} joueur(s)
            </span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Joueurs</CardTitle>
            <CardDescription>
              Choisissez votre équipe et désignez un espion par équipe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <LobbyPlayersList
              players={gameState.players}
              currentPlayerId={playerId}
              isCreator={isCreator}
              creatorToken={creatorToken}
              onKickPlayer={targetId => kickPlayer(targetId)}
              isKicking={isKicking}
            />

            {currentPlayer && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="font-medium">Vos actions</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground">
                      Choisir une équipe
                    </span>
                    <TeamSelector
                      currentSide={currentPlayer.side ?? null}
                      onSelectSide={side => chooseSide(side)}
                      disabled={isChoosingSide}
                    />
                  </div>
                  {currentPlayer.side && (
                    <div className="flex flex-col gap-2">
                      <span className="text-sm text-muted-foreground">
                        Rôle
                      </span>
                      <SpyDesignation
                        isSpy={Boolean(currentPlayer.isSpy)}
                        onToggleSpy={() => designateSpy()}
                        disabled={isDesignatingSpy || currentPlayer.isSpy}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {isCreator && (
              <div className="border-t pt-6">
                <Button
                  onClick={() => startRound()}
                  disabled={!canStart || isStartingRound}
                  className="w-full"
                >
                  {isStartingRound
                    ? 'Démarrage...'
                    : !readyToStart
                      ? 'En attente des équipes et espions'
                      : 'Démarrer la partie'}
                </Button>
                {!readyToStart && (
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    Chaque équipe doit avoir au moins un joueur et un espion
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => leaveGame()}
            disabled={isLeaving}
          >
            {isLeaving ? 'Déconnexion...' : 'Quitter la partie'}
          </Button>
        </div>
      </div>
    </div>
  )
}
