import type { GameTimerSettings, RoundState, Side } from '../types'
import { cn } from '@codenames/ui/lib/utils'
import { useEffect, useMemo, useState } from 'react'

export interface TurnIndicatorProps {
  round: RoundState
  timerSettings: GameTimerSettings | null | undefined
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
  timerSettings,
  isUserTurn,
  isWaitingForClueOnMyTeam = false,
  className,
}: TurnIndicatorProps) {
  const { currentTurn, currentClue, guessesRemaining, turnStartedAt } = round

  const [renderPulse, setRenderPulse] = useState(0)
  const isTimerVisible
    = Boolean(timerSettings?.isEnabled && turnStartedAt && timerSettings.durationSeconds > 0)

  useEffect(() => {
    if (!isTimerVisible || !turnStartedAt || !timerSettings)
      return
    const id = window.setInterval(() => {
      setRenderPulse(c => c + 1)
    }, 200)
    return () => window.clearInterval(id)
  }, [isTimerVisible, turnStartedAt, timerSettings])

  const timerProgress = useMemo(() => {
    void renderPulse
    if (!isTimerVisible || !turnStartedAt || !timerSettings)
      return 0
    const durationMs = timerSettings.durationSeconds * 1000
    const startMs = new Date(turnStartedAt).getTime()
    const elapsed = Date.now() - startMs
    return Math.min(1, Math.max(0, elapsed / durationMs))
  }, [isTimerVisible, turnStartedAt, timerSettings, renderPulse])

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
      {isTimerVisible && (
        <div
          className={cn(
            'pointer-events-none absolute inset-y-0 left-0 z-0 h-full transition-[width] duration-200 ease-linear',
            clueBgColor,
          )}
          style={{ width: `${timerProgress * 100}%` }}
          aria-hidden
        />
      )}

      <div className="relative z-10 flex items-center gap-2">
        <span className="text-sm">
          {primaryMessage}
        </span>
      </div>

      {currentClue && (
        <div className="absolute z-20 flex w-full items-center justify-center">
          <div className={cn('relative flex items-center gap-2 p-16 rounded-full scaleIn', clueBgColor)}>
            <span className="font-bold text-lg">
              {currentClue.word}
            </span>
            <div className={cn('flex items-center gap-2 font-bold w-8 h-8 justify-center rounded-full bg-white z-30', TEXT_COLORS[currentTurn])}>
              {guessesRemaining >= 100 ? '∞' : guessesRemaining - 1}
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10">
        {!currentClue && (
          <span className="text-sm">L'espion réfléchit...</span>
        )}
      </div>
    </div>
  )
}
