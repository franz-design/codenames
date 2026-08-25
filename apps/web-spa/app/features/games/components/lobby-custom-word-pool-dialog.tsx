import type { AppliedCustomWordPool, SelectableGameWordPackSlug } from '../types'
import { Button } from '@codenames/ui/components/primitives/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@codenames/ui/components/primitives/dialog'
import { Label } from '@codenames/ui/components/primitives/label'
import { SELECTABLE_GAME_WORD_PACK_OPTIONS } from '../types'
import { writeStoredCustomWords } from '../utils/custom-word-list-storage'
import { CustomWordListInputs } from './custom-word-list-inputs'

interface LobbyCustomWordPoolDialogProps {
  open: boolean
  words: string[]
  selectedSlugs: SelectableGameWordPackSlug[]
  onWordsChange: (words: string[]) => void
  onSelectedSlugsChange: (slugs: SelectableGameWordPackSlug[]) => void
  onOpenChange: (open: boolean) => void
  onApply: (pool: AppliedCustomWordPool) => void
}

export function LobbyCustomWordPoolDialog({
  open,
  words,
  selectedSlugs,
  onWordsChange,
  onSelectedSlugsChange,
  onOpenChange,
  onApply,
}: LobbyCustomWordPoolDialogProps) {
  const handleSlugToggle = (slug: SelectableGameWordPackSlug, isChecked: boolean): void => {
    if (isChecked) {
      onSelectedSlugsChange([...selectedSlugs, slug])
      return
    }

    onSelectedSlugsChange(selectedSlugs.filter(selected => selected !== slug))
  }

  const canApply = selectedSlugs.length > 0 || words.length > 0

  const handleApply = (): void => {
    if (!canApply)
      return

    writeStoredCustomWords(words)
    onApply({ slugs: selectedSlugs, customWords: words })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Liste custom</DialogTitle>
          <DialogDescription>
            Sélectionnez une ou plusieurs listes existantes, et ajoutez vos propres mots.
            S’il n’y a que des mots custom, ils seront mélangés avec la liste de base.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 px-6">
          <Label className="text-sm font-bold mb-1">Listes existantes</Label>
          <div className="flex flex-wrap gap-2">
            {SELECTABLE_GAME_WORD_PACK_OPTIONS.map((option) => {
              const isSelected = selectedSlugs.includes(option.slug)
              return (
                <Button
                  key={option.slug}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  aria-pressed={isSelected}
                  onClick={() => {
                    handleSlugToggle(option.slug, !isSelected)
                  }}
                >
                  {option.label}
                </Button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 px-6">
          <Label className="text-sm font-bold">Vos mots</Label>
          <CustomWordListInputs
            words={words}
            onWordsChange={onWordsChange}
          />
        </div>

        <DialogFooter className="p-6 py-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false)
            }}
          >
            Annuler
          </Button>
          <Button
            type="button"
            disabled={!canApply}
            onClick={handleApply}
          >
            Utiliser cette liste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
