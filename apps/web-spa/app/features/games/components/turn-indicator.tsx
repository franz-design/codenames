import type { RoundState, Side } from '../types'
import { cn } from '@codenames/ui/lib/utils'

export interface TurnIndicatorProps {
  round: RoundState
  isUserTurn: boolean
  isWaitingForClueOnMyTeam?: boolean
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

const CLUE_BG_COLORS: Record<Side, string> = {
  red: 'bg-red-dark',
  blue: 'bg-blue-dark',
}

const TEXT_COLORS: Record<Side, string> = {
  red: 'text-red',
  blue: 'text-blue',
}

export function TurnIndicator({
  round,
  isUserTurn,
  isWaitingForClueOnMyTeam = false,
  className,
}: TurnIndicatorProps) {
  const { currentTurn, currentClue, guessesRemaining } = round

  const primaryMessage = ((): string => {
    if (isUserTurn) {
      return 'C\'est votre tour !'
    }
    if (isWaitingForClueOnMyTeam) {
      return 'Attendez l\'indice...'
    }
    return `Au tour de l'équipe ${SIDE_LABELS[currentTurn]}`
  })()

  const clueBgColor = CLUE_BG_COLORS[currentTurn]

  return (
    <div
      className={cn(
        'relative flex flex-wrap items-center justify-between gap-3 rounded-lg p-4 text-white overflow-hidden',
        SIDE_BG_CLASSES[currentTurn],
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">
          {primaryMessage}
        </span>
      </div>

      {currentClue && (
        <div className="absolute flex w-full items-center justify-center">
          <div className={cn('gap-2 p-16 rounded-full scaleIn', clueBgColor)}>
            <span className="font-bold text-lg">
              {currentClue.word}
            </span>
          </div>
        </div>
      )}

      {currentClue
        ? (
            <div className={cn('flex items-center gap-2 font-bold w-8 h-8 justify-center rounded-full bg-white', TEXT_COLORS[currentTurn])}>
              {guessesRemaining >= 100 ? '∞' : guessesRemaining - 1}
            </div>
          )
        : (
            <span className="text-sm">L'espion réfléchit...</span>
          )}
    </div>
  )
}
