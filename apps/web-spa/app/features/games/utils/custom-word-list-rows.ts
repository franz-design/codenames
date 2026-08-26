import { CUSTOM_WORD_MAX_LENGTH, CUSTOM_WORDS_MAX_COUNT } from '../types'

export function normalizeCustomWords(words: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const word of words) {
    const trimmed = word.trim()
    if (trimmed.length === 0)
      continue

    const key = trimmed.toLocaleLowerCase('fr-FR')
    if (seen.has(key))
      continue

    seen.add(key)
    normalized.push(trimmed)
  }

  return normalized
}

function parseCustomWordDraft(draft: string): string[] {
  return draft.split(/[\n,]/).filter((token: string) => {
    const trimmed: string = token.trim()
    return trimmed.length > 0 && trimmed.length <= CUSTOM_WORD_MAX_LENGTH
  })
}

export function addCustomWordsFromDraft(existingWords: string[], draft: string): string[] {
  const parsedTokens: string[] = parseCustomWordDraft(draft)
  return normalizeCustomWords([...existingWords, ...parsedTokens]).slice(0, CUSTOM_WORDS_MAX_COUNT)
}

export function addCustomWord(words: string[], draft: string): string[] {
  return addCustomWordsFromDraft(words, draft)
}

export function removeCustomWord(words: string[], index: number): string[] {
  return words.filter((_, wordIndex) => wordIndex !== index)
}
