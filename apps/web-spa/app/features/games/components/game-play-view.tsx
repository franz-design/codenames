import type { ReactNode } from 'react'
import type { GameState, Side, TimelineItem } from '../types'
import type { GameTimelineSidebarProps } from './game-timeline-sidebar'
import { Button } from '@codenames/ui/components/primitives/button'
import { Card, CardContent, CardHeader, CardTitle } from '@codenames/ui/components/primitives/card'
import { cn } from '@codenames/ui/lib/utils'
import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { ClueForm } from './clue-form'
import { GameTimelineSidebar } from './game-timeline-sidebar'
import { TeamPlayersCard } from './team-players-card'
import { TurnIndicator } from './turn-indicator'
import { WordGrid } from './word-grid'

const SIDE_LABELS: Record<Side, string> = {
  red: 'rouge',
  blue: 'bleue',
}

const WINNING_PANEL_STYLES: Record<Side, string> = {
  red: 'bg-red border-red-dark text-white shadow-[4px_4px_0px_0px_#A11734]',
  blue: 'bg-blue border-blue-dark text-white shadow-[4px_4px_0px_0px_#42689F]',
}

export interface GamePlayViewProps {
  gameState: GameState
  playerId: string
  playerName: string | null
  /** Read-only spectator: spy grid, no actions or chat */
  isReadOnly?: boolean
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

interface GamePlayTimelineLayoutProps {
  isTimelineVisible: boolean
  onHideTimeline: () => void
  onShowTimeline: () => void
  mainClassName: string
  children: ReactNode
  timelineSidebarProps: Omit<GameTimelineSidebarProps, 'className' | 'id' | 'onHideTimeline'>
}

function GamePlayTimelineLayout({
  isTimelineVisible,
  onHideTimeline,
  onShowTimeline,
  mainClassName,
  children,
  timelineSidebarProps,
}: GamePlayTimelineLayoutProps) {
  return (
    <>
      <div className="flex w-full min-h-0">
        <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col', mainClassName)}>
          {children}
        </div>
        {isTimelineVisible && (
          <div className="mt-4 mr-4 hidden h-[calc(100%-34px)] shrink-0 lg:flex">
            <GameTimelineSidebar
              {...timelineSidebarProps}
              id="game-timeline-sidebar"
              onHideTimeline={onHideTimeline}
              className="!mt-0 !mr-0 min-h-0 min-w-64 max-w-sm flex-1 shrink-0"
            />
          </div>
        )}
      </div>
      {!isTimelineVisible && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="fixed top-24 right-0 z-40 hidden size-10 rounded-l-md rounded-r-none border-r-0 bg-background shadow-sm lg:inline-flex"
          onClick={onShowTimeline}
          aria-label="Afficher l’historique et le chat"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
      )}
    </>
  )
}

export function GamePlayView({
  gameState,
  playerId,
  isReadOnly = false,
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
  const [isTimelineVisible, setIsTimelineVisible] = useState(true)
  const currentPlayer = gameState.players.find(p => p.id === playerId)
  const viewMode: 'spy' | 'operative' = isReadOnly ? 'spy' : getViewMode(currentPlayer)
  const round = gameState.currentRound

  const timelineSidebarProps: Omit<GameTimelineSidebarProps, 'className' | 'id'> = {
    items: timelineItems,
    isLoading: timelineIsLoading,
    onSendMessage: onSendChatMessage,
    isSending: isSendingChat,
    currentPlayerId: playerId,
    isChatDisabled: isReadOnly,
  }

  const isAwaitingTeamAssignment
    = !isReadOnly
      && gameState.status === 'PLAYING'
      && currentPlayer != null
      && !currentPlayer.side

  if (!round) {
    return (
      <div className="flex flex-grow w-full min-h-full flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">Aucun round en cours</p>
      </div>
    )
  }

  const isFinished = gameState.status === 'FINISHED'
  const canGiveClue
    = !isReadOnly
      && !isFinished
      && viewMode === 'spy'
      && currentPlayer?.side === round.currentTurn
      && !round.currentClue
      && Boolean(onGiveClue)

  const canOperativeInteract
    = !isReadOnly
      && !isFinished
      && viewMode === 'operative'
      && currentPlayer?.side === round.currentTurn
      && Boolean(round.currentClue)
      && round.guessesRemaining > 0

  const isWaitingForClueOnMyTeam
    = !isReadOnly
      && !isFinished
      && viewMode === 'operative'
      && currentPlayer?.side === round.currentTurn
      && !round.currentClue

  if (isAwaitingTeamAssignment) {
    return (
      <GamePlayTimelineLayout
        isTimelineVisible={isTimelineVisible}
        onHideTimeline={() => setIsTimelineVisible(false)}
        onShowTimeline={() => setIsTimelineVisible(true)}
        mainClassName="items-center justify-center overflow-auto p-4"
        timelineSidebarProps={timelineSidebarProps}
      >
        <Card className="w-full max-w-lg border-primary/30">
          <CardHeader>
            <CardTitle className="text-center text-lg">En attente de l&apos;hôte</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              L&apos;hôte de la partie doit vous placer dans l&apos;équipe rouge ou bleue pour que vous puissiez participer.
            </p>
          </CardContent>
        </Card>
      </GamePlayTimelineLayout>
    )
  }

  return (
    <GamePlayTimelineLayout
      isTimelineVisible={isTimelineVisible}
      onHideTimeline={() => setIsTimelineVisible(false)}
      onShowTimeline={() => setIsTimelineVisible(true)}
      mainClassName="items-center overflow-auto p-4"
      timelineSidebarProps={timelineSidebarProps}
    >
      <div className="flex w-full max-w-8xl flex-col gap-6">
        {isFinished && (
          <Card
            className={
              gameState.winningSide
                ? WINNING_PANEL_STYLES[gameState.winningSide]
                : gameState.losingSide
                  ? 'border-destructive bg-destructive/5'
                  : 'border-primary'
            }
          >
            <CardHeader>
              <CardTitle
                className={cn(
                  'text-center text-white',
                )}
              >
                {gameState.winningSide
                  ? `Victoire de l'équipe ${SIDE_LABELS[gameState.winningSide]} !`
                  : gameState.losingSide
                    ? `Défaite — L'Assassin a été contacté`
                    : 'Partie terminée'}
              </CardTitle>
            </CardHeader>
            {!isReadOnly && isCreator && onRestart && (
              <CardContent className="pt-0 w-full flex justify-center">
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
            timerSettings={gameState.timerSettings}
            isUserTurn={canGiveClue || canOperativeInteract}
            isWaitingForClueOnMyTeam={isWaitingForClueOnMyTeam}
            className={cn(!isTimelineVisible && 'lg:max-w-[calc(100%-3rem)]')}
          />
        )}

        <div className="flex w-full items-start gap-6">
          <TeamPlayersCard
            side="red"
            players={gameState.players.filter(p => p.side === 'red')}
            round={round}
            className="w-[15%]"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <WordGrid
              round={round}
              viewMode={viewMode}
              playerId={playerId}
              isOperativeInteractive={canOperativeInteract && !isReadOnly}
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
            round={round}
            className="w-[15%]"
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
          <ClueForm
            gridWords={round.words}
            onSubmit={data => onGiveClue?.(data.word, data.number)}
            isPending={isCluePending}
          />
        )}
      </div>
    </GamePlayTimelineLayout>
  )
}
