import type { GameWordPackSlug } from '../types'
import { Label } from '@codenames/ui/components/primitives/label'
import { BookOpenIcon } from '@codenames/ui/icons'
import { cn } from '@codenames/ui/lib/utils'
import { GAME_WORD_PACK_OPTIONS } from '../types'

interface LobbyWordPackPanelProps {
  wordPack: GameWordPackSlug
  onWordPackChange: (wordPack: GameWordPackSlug) => void
}

export function LobbyWordPackPanel({ wordPack, onWordPackChange }: LobbyWordPackPanelProps) {
  return (
    <div className="flex flex-col gap-2 border border-primary-border py-3 px-3 rounded-md">
      <div className="flex items-center gap-2 text-sm font-medium">
        <BookOpenIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
        <Label htmlFor="lobby-word-pack" className="text-sm font-medium">
          Thématique des mots
        </Label>
      </div>
      <select
        id="lobby-word-pack"
        className={cn(
          'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
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
    </div>
  )
}
