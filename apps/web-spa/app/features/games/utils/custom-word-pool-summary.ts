import type { AppliedCustomWordPool } from '../types'
import { SELECTABLE_GAME_WORD_PACK_OPTIONS } from '../types'

export function formatCustomPoolSummary(pool: AppliedCustomWordPool): string {
  const listLabels = pool.slugs
    .map(slug => SELECTABLE_GAME_WORD_PACK_OPTIONS.find(option => option.slug === slug)?.label)
    .filter((label): label is string => label !== undefined)

  const customCount = pool.customWords.length
  const customPart = customCount === 0
    ? null
    : `${customCount} mot${customCount > 1 ? 's' : ''} custom`

  if (listLabels.length === 0 && customPart) {
    const mixedLabel = customCount > 1
      ? 'mélangés avec la liste de base'
      : 'mélangé avec la liste de base'
    return `${customPart} · ${mixedLabel}`
  }

  return [...listLabels, customPart].filter((part): part is string => part !== null).join(' · ')
}
