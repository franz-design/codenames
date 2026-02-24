import type { RoundState, Side } from '../types'
import { Badge } from '@codenames/ui/components/primitives/badge'
import { cn } from '@codenames/ui/lib/utils'
import { CLUE_NUMBER_INFINITY } from '../types'

export interface TurnIndicatorProps {
  round: RoundState
  currentPlayerSide: Side | null
  className?: string
}

const SIDE_LABELS: Record<Side, string> = {
  red: 'Rouge',
  blue: 'Bleu',
}

const SIDE_BADGE_VARIANTS: Record<Side, 'destructive' | 'default'> = {
  red: 'destructive',
  blue: 'default',
}

export function TurnIndicator({
  round,
  currentPlayerSide,
  className,
}: TurnIndicatorProps) {
  const { currentTurn, currentClue, guessesRemaining } = round
  const isMyTeamTurn = currentPlayerSide === currentTurn

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-3 rounded-lg border bg-muted/50 p-4',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Tour :</span>
        <Badge variant={SIDE_BADGE_VARIANTS[currentTurn]}>
          Équipe
          {' '}
          {SIDE_LABELS[currentTurn]}
        </Badge>
      </div>

      {currentClue && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Indice :</span>
          <span className="font-medium">
            {currentClue.word}
            {' '}
            —
            {currentClue.number === CLUE_NUMBER_INFINITY ? '∞' : currentClue.number}
          </span>
        </div>
      )}

      {currentClue && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Devinettes restantes :</span>
          <span className="font-medium">
            {guessesRemaining >= 100 ? '∞' : guessesRemaining}
          </span>
        </div>
      )}

      {isMyTeamTurn && (
        <Badge variant="outline" className="ml-auto">
          C&apos;est le tour de votre équipe
        </Badge>
      )}
    </div>
  )
}
