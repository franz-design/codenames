import type { CardType } from '../types'
import { cn } from '@codenames/ui/lib/utils'

export interface WordCardProps {
  word: string
  wordIndex: number
  cardType: CardType | null
  isRevealed: boolean
  viewMode: 'spy' | 'operative'
  highlights: { playerId: string, playerName: string }[]
  className?: string
}

const CARD_TYPE_STYLES: Record<CardType, string> = {
  red: 'bg-red-600 text-white',
  blue: 'bg-blue-600 text-white border-blue-700',
  neutral: 'bg-gray-400 text-white dark:bg-gray-500 dark:text-white',
  black: 'bg-zinc-900 text-white',
}

export function WordCard({
  word,
  wordIndex,
  cardType,
  isRevealed,
  viewMode,
  highlights,
  className,
}: WordCardProps) {
  const showColor = viewMode === 'spy' || (viewMode === 'operative' && isRevealed)
  const effectiveCardType = showColor && cardType ? cardType : null

  const baseStyles = 'flex min-h-[3.5rem] flex-col items-center justify-center rounded-sm p-3 text-center text-sm font-medium transition-colors'
  const faceDownStyles = 'bg-muted text-muted-foreground border-muted-foreground/20'
  const faceUpStyles = effectiveCardType ? CARD_TYPE_STYLES[effectiveCardType] : faceDownStyles

  const hasHighlights = highlights.length > 0
  const highlightBorder = hasHighlights ? 'ring-2 ring-primary' : ''

  return (
    <div
      className={cn(
        baseStyles,
        showColor ? faceUpStyles : faceDownStyles,
        highlightBorder,
        className,
      )}
      data-word-index={wordIndex}
    >
      <span className="line-clamp-2 break-words">{word}</span>
      {hasHighlights && (
        <div className="mt-1 flex flex-wrap justify-center gap-1">
          {highlights.map(h => (
            <span
              key={h.playerId}
              className="rounded bg-black/20 px-1.5 py-0.5 text-xs"
            >
              {h.playerName}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
