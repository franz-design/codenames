import type { GameState, Side } from '../types'
import { Badge } from '@codenames/ui/components/primitives/badge'
import { Button } from '@codenames/ui/components/primitives/button'
import { Card, CardContent, CardHeader, CardTitle } from '@codenames/ui/components/primitives/card'
import { TurnIndicator } from './turn-indicator'
import { WordGrid } from './word-grid'

const SIDE_LABELS: Record<Side, string> = {
  red: 'Rouge',
  blue: 'Bleu',
}

export interface GamePlayViewProps {
  gameState: GameState
  playerId: string
  playerName: string | null
  isConnected: boolean
  onLeaveGame: () => void
  isLeaving: boolean
}

function getViewMode(
  currentPlayer: GameState['players'][0] | undefined,
): 'spy' | 'operative' {
  return currentPlayer?.isSpy ? 'spy' : 'operative'
}

export function GamePlayView({
  gameState,
  playerId,
  playerName,
  isConnected,
  onLeaveGame,
  isLeaving,
}: GamePlayViewProps) {
  const currentPlayer = gameState.players.find(p => p.id === playerId)
  const viewMode = getViewMode(currentPlayer)
  const round = gameState.currentRound

  if (!round) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">Aucun round en cours</p>
      </main>
    )
  }

  const isFinished = gameState.status === 'FINISHED'

  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Codenames</h1>
            <Badge variant="outline">
              {currentPlayer?.side ? SIDE_LABELS[currentPlayer.side] : 'Sans équipe'}
            </Badge>
            <Badge variant="secondary">
              {viewMode === 'spy' ? 'Espion' : 'Opératif'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm ${isConnected ? 'text-green-600' : 'text-muted-foreground'}`}
            >
              {isConnected ? 'Connecté' : 'Connexion...'}
            </span>
            <span className="text-sm text-muted-foreground">
              {playerName ?? 'Joueur'}
            </span>
          </div>
        </div>

        {isFinished && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>
                {gameState.winningSide
                  ? `Victoire de l'équipe ${SIDE_LABELS[gameState.winningSide]} !`
                  : gameState.losingSide
                    ? `Défaite — L'Assassin a été contacté`
                    : 'Partie terminée'}
              </CardTitle>
            </CardHeader>
          </Card>
        )}

        {!isFinished && (
          <TurnIndicator
            round={round}
            currentPlayerSide={currentPlayer?.side ?? null}
          />
        )}

        <Card>
          <CardContent className="p-4">
            <WordGrid round={round} viewMode={viewMode} />
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onLeaveGame}
            disabled={isLeaving}
          >
            {isLeaving ? 'Déconnexion...' : 'Quitter la partie'}
          </Button>
        </div>
      </div>
    </main>
  )
}
