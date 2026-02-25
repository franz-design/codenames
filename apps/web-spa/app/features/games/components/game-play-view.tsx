import type { GameState, Side, TimelineItem } from '../types'
import { Badge } from '@codenames/ui/components/primitives/badge'
import { Button } from '@codenames/ui/components/primitives/button'
import { Card, CardContent, CardHeader, CardTitle } from '@codenames/ui/components/primitives/card'
import { ClueForm } from './clue-form'
import { GameTimelineSidebar } from './game-timeline-sidebar'
import { TeamPlayersCard } from './team-players-card'
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
  isCreator: boolean
  onLeaveGame: () => void
  isLeaving: boolean
  onGiveClue?: (word: string, number: number) => void
  isCluePending?: boolean
  onHighlight?: (wordIndex: number) => void
  onUnhighlight?: (wordIndex: number) => void
  onSelect?: (wordIndex: number) => void
  onPass?: () => void
  onRestart?: () => void
  isOperativeActionPending?: boolean
  isRestartPending?: boolean
  timelineItems: TimelineItem[]
  timelineIsLoading: boolean
  onSendChatMessage: (content: string) => void
  isSendingChat: boolean
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
  isCreator,
  onLeaveGame,
  isLeaving,
  onGiveClue,
  isCluePending = false,
  onHighlight,
  onUnhighlight,
  onSelect,
  onPass,
  onRestart,
  isOperativeActionPending = false,
  isRestartPending = false,
  timelineItems,
  timelineIsLoading,
  onSendChatMessage,
  isSendingChat,
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
  const canGiveClue
    = !isFinished
      && viewMode === 'spy'
      && currentPlayer?.side === round.currentTurn
      && !round.currentClue
      && Boolean(onGiveClue)

  const canOperativeInteract
    = !isFinished
      && viewMode === 'operative'
      && currentPlayer?.side === round.currentTurn
      && Boolean(round.currentClue)
      && round.guessesRemaining > 0

  return (
    <main className="flex w-full">
      <div className="flex min-h-0 min-w-0 flex-[3] flex-col items-center overflow-auto p-4">
        <div className="flex w-full max-w-5xl flex-col gap-6">
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
            <Card
              className={
                gameState.winningSide
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                  : gameState.losingSide
                    ? 'border-destructive bg-destructive/5'
                    : 'border-primary'
              }
            >
              <CardHeader>
                <CardTitle
                  className={
                    gameState.winningSide
                      ? 'text-green-700 dark:text-green-400'
                      : gameState.losingSide
                        ? 'text-destructive'
                        : ''
                  }
                >
                  {gameState.winningSide
                    ? `Victoire de l'équipe ${SIDE_LABELS[gameState.winningSide]} !`
                    : gameState.losingSide
                      ? `Défaite — L'Assassin a été contacté`
                      : 'Partie terminée'}
                </CardTitle>
              </CardHeader>
              {isCreator && onRestart && (
                <CardContent className="pt-0">
                  <Button
                    onClick={onRestart}
                    disabled={isRestartPending}
                  >
                    {isRestartPending ? 'Chargement...' : 'Nouvelle partie'}
                  </Button>
                </CardContent>
              )}
            </Card>
          )}

          {!isFinished && (
            <TurnIndicator
              round={round}
              currentPlayerSide={currentPlayer?.side ?? null}
            />
          )}

          <div className="flex w-full items-stretch gap-3">
            <TeamPlayersCard
              side="red"
              players={gameState.players.filter(p => p.side === 'red')}
              className="w-32 shrink-0"
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <WordGrid
                round={round}
                viewMode={viewMode}
                playerId={playerId}
                isOperativeInteractive={canOperativeInteract}
                isGameFinished={isFinished}
                onHighlight={onHighlight}
                onUnhighlight={onUnhighlight}
                onSelect={onSelect}
                isActionPending={isOperativeActionPending}
              />
            </div>
            <TeamPlayersCard
              side="blue"
              players={gameState.players.filter(p => p.side === 'blue')}
              className="w-32 shrink-0"
            />
          </div>

          {canOperativeInteract && onPass && (
            <Card className="py-2 px-2">
              <CardContent className="flex justify-center p-4">
                <Button
                  variant="outline"
                  onClick={onPass}
                  disabled={isOperativeActionPending}
                >
                  Fini de deviner
                </Button>
              </CardContent>
            </Card>
          )}

          {canGiveClue && (
            <Card className="py-2 px-2">
              <CardContent className="p-4">
                <p className="mb-4 text-sm text-muted-foreground">
                  C&apos;est à vous de donner un indice à votre équipe.
                </p>
                <ClueForm
                  gridWords={round.words}
                  onSubmit={data => onGiveClue?.(data.word, data.number)}
                  isPending={isCluePending}
                />
              </CardContent>
            </Card>
          )}

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
      </div>
      <GameTimelineSidebar
        items={timelineItems}
        isLoading={timelineIsLoading}
        onSendMessage={onSendChatMessage}
        isSending={isSendingChat}
      />
    </main>
  )
}
