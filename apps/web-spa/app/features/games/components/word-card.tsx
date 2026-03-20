import type { CardType } from '../types'
import { Pin } from '@codenames/ui/icons'
import { cn } from '@codenames/ui/lib/utils'
import { CardHighlights } from './card-highlights'

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
  red: 'bg-red text-white border border-red-dark font-bold shadow-[4px_4px_0px_0px_#A11734]',
  blue: 'bg-blue text-white border border-blue-dark font-bold shadow-[4px_4px_0px_0px_#42689F]',
  neutral:
    'bg-neutral text-neutral-foreground border border-neutral-dark font-bold shadow-[4px_4px_0px_0px_var(--color-neutral-dark)]',
  black:
    'bg-black text-white border border-black-dark font-bold shadow-[4px_4px_0px_0px_var(--color-black-dark)]',
}

const CARD_BACK_STYLES: Record<CardType, string> = {
  red: 'bg-red/25 border border-red-dark shadow-[4px_4px_0px_0px_#A11734]',
  blue: 'bg-blue/25 border border-blue-dark shadow-[4px_4px_0px_0px_#42689F]',
  neutral:
    'bg-neutral/25 border border-neutral-dark shadow-[4px_4px_0px_0px_var(--color-neutral-dark)]',
  black: 'bg-black/25 border border-black-dark shadow-[4px_4px_0px_0px_var(--color-black-dark)]',
}

const CARD_DARK_COLORS: Record<CardType, string> = {
  red: 'var(--color-red-dark)',
  blue: 'var(--color-blue-dark)',
  neutral: 'var(--color-neutral-dark)',
  black: 'var(--color-black-dark)',
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

  const baseStyles
    = 'group relative flex h-20 -top-[2px] -left-[2px] flex-col items-center justify-center rounded-lg border p-3 text-center text-sm font-medium transition-all duration-100'
  const faceDownStyles
    = 'bg-primary text-primary-foreground border-primary-border font-bold shadow-[4px_4px_0px_0px_#AEC0E0]'
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
    return effectiveCardType
      ? CARD_BACK_STYLES[effectiveCardType]
      : 'bg-muted border-primary-border font-bold shadow-[4px_4px_0px_0px_#AEC0E0] text-muted-foreground'
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
        isInteractive
        && !isRevealed
        && 'cursor-pointer hover:top-0 hover:left-0 hover:shadow-[2px_2px_0px_0px_#AEC0E0] hover:bg-primary/90',
        showRevealedBack && 'cursor-default',
        className,
      )}
      data-word-index={wordIndex}
    >
      {showRevealedBack && effectiveCardType && (
        <div
          className="pointer-events-none absolute inset-0 rounded-md"
          style={{
            background: `repeating-linear-gradient(
              45deg,
              transparent 0,
              transparent 3px,
              color-mix(in srgb, ${CARD_DARK_COLORS[effectiveCardType]} 30%, transparent) 3px,
              color-mix(in srgb, ${CARD_DARK_COLORS[effectiveCardType]} 30%, transparent) 5px
            )`,
          }}
          aria-hidden
        />
      )}
      {showRevealedBack && (
        <>
          <div
            className={cn(
              'absolute inset-0 flex flex-col items-center justify-center rounded-md opacity-0 transition-opacity duration-200 group-hover:opacity-100',
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
          {hasHighlights && <CardHighlights highlights={highlights} isSpy={viewMode === 'spy'} />}
        </>
      )}
    </div>
  )
}
