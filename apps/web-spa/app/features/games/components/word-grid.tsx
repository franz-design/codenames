import type { CardType, RoundState } from '../types'
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
}: WordGridProps) {
  const { words, results, revealedWords, highlights } = round
  const revealedMap = getRevealedMap(revealedWords)
  const isInteractive = viewMode === 'operative' && isOperativeInteractive

  return (
    <div
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

        return (
          <WordCard
            key={`${index}-${word}`}
            word={word}
            wordIndex={index}
            cardType={results[index] ?? null}
            isRevealed={showAsRevealed}
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
        )
      })}
    </div>
  )
}
