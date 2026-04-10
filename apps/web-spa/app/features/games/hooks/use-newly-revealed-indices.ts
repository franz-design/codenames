import type { RevealedWord } from '../types'
import { useLayoutEffect, useRef } from 'react'

export interface NewlyRevealedItem {
  wordIndex: number
  cardType: RevealedWord['cardType']
}

export interface UseNewlyRevealedIndicesOptions {
  enabled: boolean
  onNewReveals: (items: NewlyRevealedItem[]) => void
}

/**
 * Detects words that became revealed compared to the previous commit (same round).
 * Skips the first sync after mount or round change so reload / hydration does not animate.
 * Invoke {@link onNewReveals} in a useLayoutEffect (before paint) via this hook’s layout phase.
 */
export function useNewlyRevealedIndices(
  roundId: string,
  revealedWords: RevealedWord[],
  { enabled, onNewReveals }: UseNewlyRevealedIndicesOptions,
): void {
  const prevRoundIdRef = useRef(roundId)
  const prevIndicesRef = useRef<Set<number>>(new Set())
  const didHydrateRef = useRef(false)
  const onNewRevealsRef = useRef(onNewReveals)
  onNewRevealsRef.current = onNewReveals

  useLayoutEffect(() => {
    const currentMap = new Map(revealedWords.map(r => [r.wordIndex, r.cardType]))

    if (prevRoundIdRef.current !== roundId) {
      prevRoundIdRef.current = roundId
      prevIndicesRef.current = new Set(currentMap.keys())
      didHydrateRef.current = true
      return
    }

    if (!didHydrateRef.current) {
      prevIndicesRef.current = new Set(currentMap.keys())
      didHydrateRef.current = true
      return
    }

    const prev = prevIndicesRef.current
    const added: NewlyRevealedItem[] = []
    for (const [wordIndex, cardType] of currentMap) {
      if (!prev.has(wordIndex))
        added.push({ wordIndex, cardType })
    }
    prevIndicesRef.current = new Set(currentMap.keys())

    if (added.length > 0 && enabled)
      onNewRevealsRef.current(added)
  }, [roundId, revealedWords, enabled])
}
