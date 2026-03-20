import type { RoundState, Side } from '../types'
import { cn } from '@codenames/ui/lib/utils'

export interface TurnIndicatorProps {
  round: RoundState
  className?: string
}

const SIDE_LABELS: Record<Side, string> = {
  red: 'rouge',
  blue: 'bleue',
}

const SIDE_BG_CLASSES: Record<Side, string> = {
  red: 'bg-red',
  blue: 'bg-blue',
}

export function TurnIndicator({
  round,
  className,
}: TurnIndicatorProps) {
  const { currentTurn, currentClue, guessesRemaining } = round

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-lg p-4 text-white',
        SIDE_BG_CLASSES[currentTurn],
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">
          Au tour de l'équipe
          {' '}
          {SIDE_LABELS[currentTurn]}
        </span>
      </div>

      {currentClue && (
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">
            {currentClue.word}
          </span>
        </div>
      )}

      {currentClue && (
        <div className="flex items-center gap-2">
          <span className="text-sm">Tentatives restantes :</span>
          <span className="font-medium">
            {guessesRemaining >= 100 ? '∞' : guessesRemaining}
          </span>
        </div>
      )}
    </div>
  )
}
