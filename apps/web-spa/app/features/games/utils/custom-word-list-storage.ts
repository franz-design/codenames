export const CUSTOM_WORD_LIST_STORAGE_KEY = 'codenames.custom-word-list'

export function readStoredCustomWords(): string[] {
  if (typeof window === 'undefined')
    return []

  try {
    const raw = window.localStorage.getItem(CUSTOM_WORD_LIST_STORAGE_KEY)
    if (!raw)
      return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed))
      return []

    return parsed.filter((word): word is string => typeof word === 'string')
  }
  catch {
    return []
  }
}

export function writeStoredCustomWords(words: string[]): void {
  if (typeof window === 'undefined')
    return

  window.localStorage.setItem(CUSTOM_WORD_LIST_STORAGE_KEY, JSON.stringify(words))
}
