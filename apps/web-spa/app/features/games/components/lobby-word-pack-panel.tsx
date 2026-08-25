import type { AppliedCustomWordPool, GameWordPackSlug, SelectableGameWordPackSlug } from '../types'
import { Button } from '@codenames/ui/components/primitives/button'
import { Label } from '@codenames/ui/components/primitives/label'
import { BookOpenIcon, ChevronDownIcon } from '@codenames/ui/icons'
import { cn } from '@codenames/ui/lib/utils'
import { useState } from 'react'
import { GAME_WORD_PACK_OPTIONS } from '../types'
import {
  readStoredCustomWords,
  writeStoredCustomWords,
} from '../utils/custom-word-list-storage'
import { formatCustomPoolSummary } from '../utils/custom-word-pool-summary'
import { LobbyCustomWordPoolDialog } from './lobby-custom-word-pool-dialog'

interface LobbyWordPackPanelProps {
  wordPack: GameWordPackSlug
  customPool: AppliedCustomWordPool | null
  onWordPackChange: (wordPack: GameWordPackSlug) => void
  onApplyCustomPool: (pool: AppliedCustomWordPool) => void
}

export function LobbyWordPackPanel({
  wordPack,
  customPool,
  onWordPackChange,
  onApplyCustomPool,
}: LobbyWordPackPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedSlugs, setSelectedSlugs] = useState<SelectableGameWordPackSlug[]>([])
  const [customWords, setCustomWords] = useState<string[]>([])

  const handleOpenDialog = (): void => {
    setCustomWords(readStoredCustomWords())
    setIsDialogOpen(true)
  }

  const handleWordsChange = (nextWords: string[]): void => {
    setCustomWords(nextWords)
    writeStoredCustomWords(nextWords)
  }

  return (
    <div className="flex flex-col gap-2 border border-primary-border py-3 px-3 rounded-md">
      <div className="flex items-center gap-2 text-sm font-medium">
        <BookOpenIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
        <Label htmlFor="lobby-word-pack" className="text-sm font-medium">
          Thématique des mots
        </Label>
      </div>
      <div className="relative">
        <select
          id="lobby-word-pack"
          className={cn(
            'w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm',
            'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
          value={wordPack}
          onChange={(e) => {
            onWordPackChange(e.target.value as GameWordPackSlug)
          }}
        >
          {GAME_WORD_PACK_OPTIONS.map(option => (
            <option key={option.slug} value={option.slug}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
      <Button
        type="button"
        variant={customPool !== null ? 'default' : 'outline'}
        className="w-full"
        onClick={handleOpenDialog}
      >
        Liste custom
      </Button>
      {customPool !== null && (
        <p className="text-xs text-muted-foreground">
          {formatCustomPoolSummary(customPool)}
        </p>
      )}
      <LobbyCustomWordPoolDialog
        open={isDialogOpen}
        words={customWords}
        selectedSlugs={selectedSlugs}
        onWordsChange={handleWordsChange}
        onSelectedSlugsChange={setSelectedSlugs}
        onOpenChange={setIsDialogOpen}
        onApply={onApplyCustomPool}
      />
    </div>
  )
}
