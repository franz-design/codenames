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

export function addCustomWord(words: string[], draft: string): string[] {
  return normalizeCustomWords([...words, draft])
}

export function removeCustomWord(words: string[], index: number): string[] {
  return words.filter((_, wordIndex) => wordIndex !== index)
}
