import type { KeyboardEvent, MouseEvent } from 'react'
import type { CardType } from '../types'
import { Bookmark } from '@codenames/ui/icons'
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
  red: 'bg-red text-white border border-red-dark font-bold',
  blue: 'bg-blue text-white border border-blue-dark font-bold',
  neutral: 'bg-neutral text-neutral-foreground border border-neutral-dark font-bold',
  black: 'bg-black text-white border border-black-dark font-bold',
}

const CARD_LAYER_UNDER_STYLES: Record<CardType, string> = {
  red: 'border border-red-dark bg-red-dark',
  blue: 'border border-blue-dark bg-blue-dark',
  neutral: 'border border-neutral-dark bg-[var(--color-neutral-dark)]',
  black: 'border border-black-dark bg-[var(--color-black-dark)]',
}

const FACE_DOWN_LAYER_UNDER = 'border border-primary-border bg-[#AEC0E0]'

const CARD_REVEALED_BACK_FACE: Record<CardType, string> = {
  red: 'border border-red-dark word-card-revealed-back-red text-transparent',
  blue: 'border border-blue-dark word-card-revealed-back-blue text-transparent',
  neutral: 'border border-neutral-dark word-card-revealed-back-neutral text-transparent',
  black: 'border border-black-dark word-card-revealed-back-black text-transparent',
}

const CARD_SHADOW_LAYER_HOVER: Record<CardType, string> = {
  red: 'bg-black group-hover:bg-red-dark',
  blue: 'bg-black group-hover:bg-blue-dark',
  neutral: 'bg-neutral-foreground group-hover:bg-neutral-dark',
  black: 'bg-black group-hover:bg-black-dark',
}

const CARD_REVEALED_HOVER_TEXT: Record<CardType, string> = {
  red: 'group-hover:text-white group-hover:bg-red',
  blue: 'group-hover:text-white group-hover:bg-blue',
  neutral: 'group-hover:text-neutral-foreground group-hover:bg-neutral',
  black: 'group-hover:text-primary-foreground',
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
    = 'relative z-10 flex h-20 flex-col items-center justify-center rounded-lg border p-3 text-center text-sm font-medium origin-center transition-all duration-200'
  const faceDownStyles
    = 'bg-primary text-primary-foreground border-primary-border font-bold'
  const faceUpStyles = effectiveCardType ? CARD_TYPE_STYLES[effectiveCardType] : faceDownStyles

  const hasHighlights = highlights.length > 0

  const showRevealedBack = isRevealed && !isGameFinished

  const handlePinClick = (e: MouseEvent) => {
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
    return 'bg-muted border-primary-border font-bold text-muted-foreground'
  }

  const getLayerUnderStyles = (): string => {
    if (isGameFinished) {
      return effectiveCardType
        ? CARD_LAYER_UNDER_STYLES[effectiveCardType]
        : FACE_DOWN_LAYER_UNDER
    }
    if (!isRevealed) {
      return viewMode === 'spy'
        ? (effectiveCardType ? CARD_LAYER_UNDER_STYLES[effectiveCardType] : FACE_DOWN_LAYER_UNDER)
        : FACE_DOWN_LAYER_UNDER
    }
    return effectiveCardType
      ? CARD_LAYER_UNDER_STYLES[effectiveCardType]
      : FACE_DOWN_LAYER_UNDER
  }

  if (showRevealedBack && effectiveCardType) {
    return (
      <div className="group relative perspective-midrange cursor-pointer" data-word-card-anchor={wordIndex}>
        <div
          className={cn(
            'absolute left-[4px] top-[4px] z-0 flex h-20 w-full items-center justify-center rounded-[12px] [transform-style:preserve-3d] transition-colors duration-500 ease-in-out',
            CARD_SHADOW_LAYER_HOVER[effectiveCardType],
          )}
          aria-hidden
        />
        <div
          className={cn(
            'relative z-10 flex h-20 w-full flex-col items-center justify-center rounded-lg border p-3 text-center text-sm font-bold [transform-style:preserve-3d] transition-card-flip',
            '-rotate-x-[180deg]',
            CARD_REVEALED_BACK_FACE[effectiveCardType],
            'group-hover:rotate-x-[0deg] group-hover:border-primary-border group-hover:bg-primary group-hover:[background-image:none] group-hover:[&::before]:opacity-0',
            CARD_REVEALED_HOVER_TEXT[effectiveCardType],
            className,
          )}
          data-word-index={wordIndex}
          aria-label={word}
        >
          <span className="line-clamp-2 break-words px-2">{word}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative perspective-midrange" data-word-card-anchor={wordIndex}>
      <div className="relative h-20 w-full [transform-style:preserve-3d]">
        <div
          className={cn(
            'pointer-events-none absolute left-[4px] top-[4px] z-0 h-20 w-full origin-center rounded-[12px] [transform-style:preserve-3d]',
            getLayerUnderStyles(),
          )}
          aria-hidden
        />
        <div
          role={isInteractive && !isRevealed ? 'button' : undefined}
          tabIndex={isInteractive && !isRevealed ? 0 : undefined}
          onClick={handleCardClick}
          onKeyDown={(e: KeyboardEvent) => {
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
            && 'cursor-pointer hover:bg-white',
            showRevealedBack && 'cursor-default',
            className,
          )}
          data-word-index={wordIndex}
        >
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
                    'absolute right-1 -top-2 cursor-pointer rounded p-1 opacity-0 transition-opacity group-hover:opacity-50',
                    'hover:opacity-100 focus:opacity-100 focus:outline-none',
                    hasMyHighlight && 'group-hover:opacity-100 opacity-100 hover:opacity-50',
                  )}
                >
                  <Bookmark
                    className="h-5 w-5 fill-current"
                  />
                </button>
              )}
              <span className="line-clamp-2 break-words">{word}</span>
              {hasHighlights && <CardHighlights highlights={highlights} isSpy={viewMode === 'spy'} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
