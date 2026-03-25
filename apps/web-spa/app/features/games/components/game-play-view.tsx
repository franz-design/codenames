import type { GameState, Side, TimelineItem } from '../types'
import { Button } from '@codenames/ui/components/primitives/button'
import { Card, CardContent, CardHeader, CardTitle } from '@codenames/ui/components/primitives/card'
import { ClueForm } from './clue-form'
import { GameTimelineSidebar } from './game-timeline-sidebar'
import { TeamPlayersCard } from './team-players-card'
import { TurnIndicator } from './turn-indicator'
import { WordGrid } from './word-grid'

const SIDE_LABELS: Record<Side, string> = {
  red: 'rouge',
  blue: 'bleue',
}

export interface GamePlayViewProps {
  gameState: GameState
  playerId: string
  playerName: string | null
  isConnected: boolean
  isCreator: boolean
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
  isCreator,
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
      <div className="flex flex-grow w-full min-h-full flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">Aucun round en cours</p>
      </div>
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
    <div className="flex w-full">
      <div className="flex min-h-0 min-w-0 flex-[3] flex-col items-center overflow-auto p-4">
        <div className="flex w-full max-w-5xl flex-col gap-6">
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
                      ? 'text-green-700 dark:text-green-400 text-center'
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
            />
          )}

          <div className="flex w-full items-start gap-6">
            <TeamPlayersCard
              side="red"
              players={gameState.players.filter(p => p.side === 'red')}
              className="w-32"
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
            <Button
              onClick={onPass}
              disabled={isOperativeActionPending}
              className="w-xs justify-center mt-4 mx-auto"
            >
              Fini de deviner
            </Button>
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
        </div>
      </div>
      <GameTimelineSidebar
        items={timelineItems}
        isLoading={timelineIsLoading}
        onSendMessage={onSendChatMessage}
        isSending={isSendingChat}
      />
    </div>
  )
}
