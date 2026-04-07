import type { GameState, GameTimerSettings, Side } from '../types'
import { Button } from '@codenames/ui/components/primitives/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@codenames/ui/components/primitives/card'
import { toast } from '@codenames/ui/components/primitives/sonner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@codenames/ui/components/primitives/tooltip'
import { Shuffle, Users2 } from '@codenames/ui/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import {
  createGamesApiClient,
  useGameSession,
} from '../index'
import { canStartGame } from '../utils/can-start-game'
import { LobbyPlayersList } from './lobby-players-list'
import { LobbySettings } from './lobby-settings'
import { SpyDesignation } from './spy-designation'

interface GameLobbyViewProps {
  gameId: string
  gameState: GameState
  readOnly?: boolean
}

export function GameLobbyView({ gameId, gameState, readOnly = false }: GameLobbyViewProps) {
  const queryClient = useQueryClient()
  const { playerId, creatorToken, isCreator } = useGameSession()
  const currentPlayer = gameState.players.find(p => p.id === playerId)
  const api = createGamesApiClient(playerId ?? '')

  const { mutate: chooseSide } = useMutation({
    mutationFn: (side: Side) => api.chooseSide(gameId, side),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['gameState', gameId, playerId] })
    },
  })

  const { mutate: designateSpy, isPending: isDesignatingSpy } = useMutation({
    mutationFn: () => api.designateSpy(gameId),
  })

  const { mutate: kickPlayer, isPending: isKicking } = useMutation({
    mutationFn: (targetPlayerId: string) => {
      if (!creatorToken)
        throw new Error('Creator token required')
      return api.kickPlayer(gameId, targetPlayerId, creatorToken)
    },
  })

  const { mutate: designatePlayerAsSpy, isPending: isDesignatingPlayerSpy } = useMutation({
    mutationFn: (targetPlayerId: string) => {
      if (!creatorToken)
        throw new Error('Creator token required')
      return api.designatePlayerAsSpy(gameId, targetPlayerId, creatorToken)
    },
  })

  const serverTimer = gameState.timerSettings ?? { isEnabled: false, durationSeconds: 120 }

  const timerForStartRef = useRef<GameTimerSettings>({
    isEnabled: serverTimer.isEnabled,
    durationSeconds: serverTimer.durationSeconds,
  })

  const { mutate: startRound, isPending: isStartingRound } = useMutation({
    mutationFn: () => {
      if (!creatorToken)
        throw new Error('Creator token required')
      const timer = timerForStartRef.current
      return api.startRound(gameId, {
        timerSettings: {
          creatorToken,
          isEnabled: timer.isEnabled,
          durationSeconds: timer.durationSeconds,
        },
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['gameState', gameId, playerId] })
    },
  })

  const { mutate: shuffleLobbyTeams, isPending: isShufflingTeams } = useMutation({
    mutationFn: () => {
      if (!creatorToken)
        throw new Error('Creator token required')
      return api.shuffleLobbyTeams(gameId, creatorToken)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['gameState', gameId, playerId] })
    },
    onError: () => {
      toast.error('Impossible de répartir les équipes')
    },
  })

  const readyToStart = canStartGame(gameState)
  const canStart = isCreator && readyToStart

  const handleCopyJoinLink = () => {
    const joinUrl = `${window.location.origin}/games/${gameId}/join`
    navigator.clipboard.writeText(joinUrl).then(
      () => toast.success('Lien copié dans le presse-papier', {
        position: 'top-right',
        style: {
          textAlign: 'center',
          justifyContent: 'center',
          width: 'auto',
          margin: 'auto',
          marginLeft: 'auto',
        },
      }),
      () => toast.error('Impossible de copier le lien'),
    )
  }

  const handleShufflePlayers = () => {
    if (!isCreator || !creatorToken) {
      toast.error('Seul l\'hôte peut répartir les équipes')
      return
    }
    if (gameState.players.length === 0)
      return
    shuffleLobbyTeams()
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 mt-4">
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-bold">Lobby</h1>
          <div className="flex items-center gap-2">
            {!readOnly && (
              <Button
                variant="outline"
                onClick={handleCopyJoinLink}
              >
                Copier le lien d&apos;invitation
              </Button>
            )}
          </div>
        </div>

        <Card className="p-0">
          <div className="flex gap-0">
            <div className="flex flex-col gap-4 py-6">
              <CardHeader>
                <div className="flex justify-between items-start gap-8">
                  <div className="flex flex-col gap-2">
                    <CardTitle>Joueurs</CardTitle>
                    <CardDescription>
                      Choisissez votre équipe et désignez un espion par équipe
                    </CardDescription>
                  </div>
                  {isCreator && (
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            aria-label="Répartir les joueurs au hasard"
                            disabled={
                              readOnly
                              || gameState.players.length === 0
                              || isShufflingTeams
                            }
                            onClick={handleShufflePlayers}
                          >
                            <Shuffle className="w-4 h-4" />
                            <Users2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Répartir les joueurs au hasard
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <LobbyPlayersList
                  players={gameState.players}
                  currentPlayerId={playerId}
                  isCreator={isCreator}
                  creatorToken={creatorToken}
                  onKickPlayer={targetId => kickPlayer(targetId)}
                  onDesignateSpy={targetId => designatePlayerAsSpy(targetId)}
                  isKicking={isKicking}
                  isDesignatingSpy={isDesignatingPlayerSpy}
                  currentPlayer={currentPlayer ?? null}
                  onSelectSide={side => chooseSide(side)}
                />

                {currentPlayer && currentPlayer.side && (
                  <div className="flex flex-col gap-2">
                    <SpyDesignation
                      isSpy={Boolean(currentPlayer.isSpy)}
                      onToggleSpy={() => designateSpy()}
                      disabled={isDesignatingSpy || currentPlayer.isSpy}
                    />
                  </div>
                )}
              </CardContent>
            </div>

            {isCreator && (
              <div className="flex flex-col gap-4 border-l py-6 w-1/2">
                <CardHeader className="pb-2">
                  <CardTitle>Options</CardTitle>
                  <CardDescription>
                    Configurez les options de la partie
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col justify-between flex-1 h-full px-0">
                  <div className="border-t pt-6 flex flex-col justify-between flex-1 h-full px-6">
                    <LobbySettings
                      timerSettings={serverTimer}
                      onTimerChange={(settings) => {
                        timerForStartRef.current = settings
                      }}
                    />

                    <div className="flex flex-col gap-2">
                      {!readyToStart && (
                        <p className="mt-2 text-center text-xs italic text-muted-foreground">
                          Chaque équipe doit avoir au moins un joueur et un espion
                        </p>
                      )}
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
                    </div>
                  </div>
                </CardContent>
              </div>
            )}

          </div>
        </Card>
      </div>
    </div>
  )
}
