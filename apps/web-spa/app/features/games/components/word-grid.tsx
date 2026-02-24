import type { CardType, RoundState } from '../types'
import { WordCard } from './word-card'

export interface WordGridProps {
  round: RoundState
  viewMode: 'spy' | 'operative'
  className?: string
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

export function WordGrid({ round, viewMode, className }: WordGridProps) {
  const { words, results, revealedWords, highlights } = round
  const revealedMap = getRevealedMap(revealedWords)

  return (
    <div
      className={`grid grid-cols-5 gap-2 ${className ?? ''}`}
      role="grid"
      aria-label="Grille de mots Codenames"
    >
      {words.map((word, index) => (
        <WordCard
          key={`${index}-${word}`}
          word={word}
          wordIndex={index}
          cardType={results[index] ?? null}
          isRevealed={revealedMap.has(index)}
          viewMode={viewMode}
          highlights={getHighlightsForWord(highlights, index)}
        />
      ))}
    </div>
  )
}
