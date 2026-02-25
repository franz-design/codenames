import type { CardType } from '../types'
import { Pin } from '@codenames/ui/icons'
import { cn } from '@codenames/ui/lib/utils'

export interface WordCardProps {
  word: string
  wordIndex: number
  cardType: CardType | null
  isRevealed: boolean
  viewMode: 'spy' | 'operative'
  highlights: { playerId: string, playerName: string }[]
  className?: string
  isInteractive?: boolean
  hasMyHighlight?: boolean
  isGameFinished?: boolean
  onHighlight?: (wordIndex: number) => void
  onUnhighlight?: (wordIndex: number) => void
  onSelect?: (wordIndex: number) => void
  isActionPending?: boolean
}

const CARD_TYPE_STYLES: Record<CardType, string> = {
  red: 'bg-red-600 text-white',
  blue: 'bg-blue-600 text-white border-blue-700',
  neutral: 'bg-gray-400 text-white dark:bg-gray-500 dark:text-white',
  black: 'bg-zinc-900 text-white',
}

const CARD_BACK_STYLES: Record<CardType, string> = {
  red: 'bg-red-600/25 border-red-700/30',
  blue: 'bg-blue-600/25 border-blue-700/30',
  neutral: 'bg-gray-400/25 border-gray-500/30 dark:bg-gray-500/25 dark:border-gray-600/30',
  black: 'bg-zinc-900/25 border-zinc-800/30',
}

export function WordCard({
  word,
  wordIndex,
  cardType,
  isRevealed,
  viewMode,
  highlights,
  className,
  isInteractive = false,
  hasMyHighlight = false,
  isGameFinished = false,
  onHighlight,
  onUnhighlight,
  onSelect,
  isActionPending = false,
}: WordCardProps) {
  const showColorOnReveal = viewMode === 'spy' || viewMode === 'operative'
  const effectiveCardType = showColorOnReveal && cardType ? cardType : null

  const baseStyles = 'group relative flex min-h-[3.5rem] flex-col items-center justify-center rounded-sm p-3 text-center text-sm font-medium transition-all duration-200'
  const faceDownStyles = 'bg-muted text-muted-foreground border-muted-foreground/20'
  const faceUpStyles = effectiveCardType ? CARD_TYPE_STYLES[effectiveCardType] : faceDownStyles

  const hasHighlights = highlights.length > 0

  const showRevealedBack = isRevealed && !isGameFinished

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isInteractive || isRevealed || isActionPending)
      return
    if (hasMyHighlight)
      onUnhighlight?.(wordIndex)
    else
      onHighlight?.(wordIndex)
  }

  const handleCardClick = () => {
    if (!isInteractive || isRevealed || isActionPending)
      return
    onSelect?.(wordIndex)
  }

  const getMainFaceStyles = () => {
    if (isGameFinished) {
      return faceUpStyles
    }
    if (!isRevealed) {
      return viewMode === 'spy' ? faceUpStyles : faceDownStyles
    }
    return effectiveCardType ? CARD_BACK_STYLES[effectiveCardType] : 'bg-muted border border-muted-foreground/20'
  }

  return (
    <div
      role={isInteractive && !isRevealed ? 'button' : undefined}
      tabIndex={isInteractive && !isRevealed ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (isInteractive && !isRevealed && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          handleCardClick()
        }
      }}
      className={cn(
        baseStyles,
        getMainFaceStyles(),
        isInteractive && !isRevealed && 'cursor-pointer hover:opacity-90',
        showRevealedBack && 'cursor-default',
        className,
      )}
      data-word-index={wordIndex}
    >
      {showRevealedBack && (
        <>
          <div
            className={cn(
              'absolute inset-0 flex flex-col items-center justify-center rounded-sm opacity-0 transition-opacity duration-200 group-hover:opacity-100',
              faceUpStyles,
            )}
          >
            <span className="line-clamp-2 break-words px-2">{word}</span>
          </div>
          <span className="invisible" aria-hidden>
            {word}
          </span>
        </>
      )}
      {!showRevealedBack && (
        <>
          {isInteractive && (onHighlight || onUnhighlight) && (
            <button
              type="button"
              onClick={handlePinClick}
              disabled={isActionPending}
              aria-label={hasMyHighlight ? 'Retirer la mise en avant' : 'Mettre en avant'}
              className={cn(
                'absolute right-1 top-1 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100',
                'hover:bg-black/10 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary',
                hasMyHighlight && 'opacity-100',
              )}
            >
              <Pin
                className={cn(
                  'h-4 w-4',
                  hasMyHighlight ? 'fill-current' : '',
                )}
              />
            </button>
          )}
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
        </>
      )}
    </div>
  )
}
