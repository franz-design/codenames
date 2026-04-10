import type { CardRevealAnimationConfig } from '../card-reveal-animation-config'
import type { NewlyRevealedItem } from '../hooks/use-newly-revealed-indices'
import type { CardType, RoundState } from '../types'
import { cn } from '@codenames/ui/lib/utils'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { mergeCardRevealAnimationConfig } from '../card-reveal-animation-config'
import { useNewlyRevealedIndices } from '../hooks/use-newly-revealed-indices'
import { CardRevealOverlay } from './card-reveal-overlay'
import { WordCard } from './word-card'

export interface WordGridProps {
  round: RoundState
  viewMode: 'spy' | 'operative'
  className?: string
  playerId?: string
  isOperativeInteractive?: boolean
  isGameFinished?: boolean
  onHighlight?: (wordIndex: number) => void
  onUnhighlight?: (wordIndex: number) => void
  onSelect?: (wordIndex: number) => void
  isActionPending?: boolean
  /** Overrides for operative reveal overlay timing / scale (ignored for spies). */
  revealAnimationConfig?: Partial<CardRevealAnimationConfig>
  /**
   * Operative only: `false` while a reveal overlay is queued or playing.
   * Use to defer end-game UI (e.g. victory) until the reveal animation finishes.
   */
  onOperativeRevealOverlayIdleChange?: (isIdle: boolean) => void
}

function getRevealedMap(revealedWords: RoundState['revealedWords']): Map<number, CardType> {
  const map = new Map<number, CardType>()
  for (const r of revealedWords) {
    map.set(r.wordIndex, r.cardType)
  }
  return map
}

function getHighlightsForWord(
  highlights: RoundState['highlights'],
  wordIndex: number,
): { playerId: string, playerName: string }[] {
  const key = String(wordIndex)
  return highlights[key] ?? []
}

interface ActiveRevealOverlayState {
  wordIndex: number
  cardType: CardType
  word: string
  rect: { left: number, top: number, width: number, height: number }
  gridRect: { left: number, top: number, width: number, height: number }
}

export function WordGrid({
  round,
  viewMode,
  className,
  playerId,
  isOperativeInteractive = false,
  isGameFinished = false,
  onHighlight,
  onUnhighlight,
  onSelect,
  isActionPending = false,
  revealAnimationConfig: revealAnimationConfigPartial,
  onOperativeRevealOverlayIdleChange,
}: WordGridProps) {
  const { words, results, revealedWords, highlights } = round
  const revealedMap = getRevealedMap(revealedWords)
  const isInteractive = viewMode === 'operative' && isOperativeInteractive

  const revealAnimationConfig = useMemo(
    () => mergeCardRevealAnimationConfig(revealAnimationConfigPartial),
    [revealAnimationConfigPartial],
  )

  const gridRef = useRef<HTMLDivElement>(null)
  const revealQueueRef = useRef<NewlyRevealedItem[]>([])
  const [queueVersion, setQueueVersion] = useState(0)
  const [animatingRevealIndices, setAnimatingRevealIndices] = useState(() => new Set<number>())
  const [activeOverlay, setActiveOverlay] = useState<ActiveRevealOverlayState | null>(null)
  const activeWordIndexRef = useRef<number | null>(null)

  const enqueueReveals = useCallback((items: NewlyRevealedItem[]) => {
    setAnimatingRevealIndices((prev) => {
      const next = new Set(prev)
      for (const i of items)
        next.add(i.wordIndex)
      return next
    })
    for (const i of items)
      revealQueueRef.current.push(i)
    setQueueVersion(v => v + 1)
  }, [])

  const revealDetectionEnabled = viewMode === 'operative'

  useNewlyRevealedIndices(round.id, round.revealedWords, {
    enabled: revealDetectionEnabled,
    onNewReveals: enqueueReveals,
  })

  /**
   * Drain reveal queue and notify parent whether the operative overlay is idle.
   * Must not use a separate layout effect for idle: after dequeuing, `activeOverlay` in this commit
   * is still null until `setActiveOverlay` flushes — a second effect would wrongly report idle=true.
   */
  useLayoutEffect(() => {
    if (viewMode !== 'operative') {
      onOperativeRevealOverlayIdleChange?.(true)
      return
    }

    let startedNewOverlay = false

    if (activeOverlay == null) {
      while (revealQueueRef.current.length > 0) {
        const next = revealQueueRef.current.shift()!
        const gridEl = gridRef.current
        const gridDomRect = gridEl?.getBoundingClientRect()
        const anchor = gridEl?.querySelector(`[data-word-card-anchor="${next.wordIndex}"]`)
        const domRect = anchor?.getBoundingClientRect()
        if (!domRect || domRect.width === 0) {
          setAnimatingRevealIndices((prev) => {
            const n = new Set(prev)
            n.delete(next.wordIndex)
            return n
          })
          continue
        }
        activeWordIndexRef.current = next.wordIndex
        setActiveOverlay({
          wordIndex: next.wordIndex,
          cardType: next.cardType,
          word: words[next.wordIndex] ?? '',
          rect: {
            left: domRect.left,
            top: domRect.top,
            width: domRect.width,
            height: domRect.height,
          },
          gridRect: gridDomRect
            ? {
                left: gridDomRect.left,
                top: gridDomRect.top,
                width: gridDomRect.width,
                height: gridDomRect.height,
              }
            : { left: 0, top: 0, width: 0, height: 0 },
        })
        startedNewOverlay = true
        break
      }
    }

    const queueStillHas = revealQueueRef.current.length > 0
    const isPlaying = activeOverlay != null || startedNewOverlay
    const isIdle = !queueStillHas && !isPlaying
    onOperativeRevealOverlayIdleChange?.(isIdle)
  }, [activeOverlay, onOperativeRevealOverlayIdleChange, queueVersion, round.id, viewMode, words])

  const handleRevealOverlayComplete = useCallback(() => {
    const idx = activeWordIndexRef.current
    activeWordIndexRef.current = null
    setActiveOverlay(null)
    if (idx != null) {
      setAnimatingRevealIndices((prev) => {
        const n = new Set(prev)
        n.delete(idx)
        return n
      })
    }
    setQueueVersion(v => v + 1)
  }, [])

  const getCardType = (index: number): CardType | null => {
    if (results && (viewMode === 'spy' || isGameFinished))
      return results[index] ?? null
    return revealedMap.get(index) ?? null
  }

  return (
    <>
      {activeOverlay != null && (
        <CardRevealOverlay
          key={`${activeOverlay.wordIndex}-${activeOverlay.cardType}-${queueVersion}`}
          word={activeOverlay.word}
          cardType={activeOverlay.cardType}
          initialRect={activeOverlay.rect}
          gridRect={activeOverlay.gridRect}
          config={revealAnimationConfig}
          onComplete={handleRevealOverlayComplete}
        />
      )}
      <div
        ref={gridRef}
        className={`grid w-full min-w-0 grid-cols-5 gap-2 ${className ?? ''}`}
        role="grid"
        aria-label="Grille de mots Codenames"
      >
        {words.map((word, index) => {
          const wordHighlights = getHighlightsForWord(highlights, index)
          const hasMyHighlight = Boolean(
            playerId && wordHighlights.some(h => h.playerId === playerId),
          )
          const wasRevealedDuringGame = revealedMap.has(index)
          const showAsRevealed = isGameFinished || wasRevealedDuringGame
          const hideRevealedVisualForAnimation = animatingRevealIndices.has(index)
          const isRevealedForCard = showAsRevealed && !hideRevealedVisualForAnimation
          const isSourceSlotHiddenForActiveOverlay
            = activeOverlay != null && activeOverlay.wordIndex === index

          return (
            <div
              key={`${index}-${word}`}
              className={cn(
                'min-w-0',
                isSourceSlotHiddenForActiveOverlay && 'invisible pointer-events-none',
              )}
            >
              <WordCard
                word={word}
                wordIndex={index}
                cardType={getCardType(index)}
                isRevealed={isRevealedForCard}
                isGameFinished={isGameFinished}
                viewMode={viewMode}
                highlights={wordHighlights}
                isInteractive={isInteractive}
                hasMyHighlight={hasMyHighlight}
                onHighlight={onHighlight}
                onUnhighlight={onUnhighlight}
                onSelect={onSelect}
                isActionPending={isActionPending}
              />
            </div>
          )
        })}
      </div>
    </>
  )
}
