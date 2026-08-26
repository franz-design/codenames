import { Button, buttonVariants } from '@codenames/ui/components/primitives/button'
import { Textarea } from '@codenames/ui/components/primitives/textarea'
import { TrashIcon, XIcon } from '@codenames/ui/icons'
import { cn } from '@codenames/ui/lib/utils'
import { useRef, useState } from 'react'
import { addCustomWordsFromDraft, removeCustomWord } from '../utils/custom-word-list-rows'

interface CustomWordListInputsProps {
  words: string[]
  onWordsChange: (words: string[]) => void
}

export function CustomWordListInputs({ words, onWordsChange }: CustomWordListInputsProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [draft, setDraft] = useState('')

  const trimmedDraft = draft.trim()
  const canAdd = trimmedDraft.length > 0

  const handleAdd = (): void => {
    if (!canAdd)
      return

    onWordsChange(addCustomWordsFromDraft(words, draft))
    setDraft('')
    textareaRef.current?.focus()
  }

  const handleClearAll = (): void => {
    onWordsChange([])
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <Textarea
          ref={textareaRef}
          value={draft}
          placeholder="Un mot par ligne, ou séparés par des virgules"
          aria-label="Nouveau mot custom"
          className="min-h-20 py-2 max-w-100"
          onChange={(event) => {
            setDraft(event.target.value)
          }}
        />
        <Button
          type="button"
          disabled={!canAdd}
          onClick={handleAdd}
        >
          Ajouter
        </Button>
      </div>

      {words.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex">
            <Button
              type="button"
              variant="outline"
              className="border-destructive-foreground text-destructive-foreground hover:text-destructive-foreground"
              size="sm"
              aria-label="Tout supprimer les mots custom"
              onClick={handleClearAll}
            >
              <TrashIcon className="size-3" strokeWidth={3} />
              Vider la liste
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto py-1 pl-1">
            {words.map((word, index) => (
              <div
                key={word}
                className={cn(buttonVariants({ variant: 'default' }), 'pr-1')}
              >
                <span>{word}</span>
                <button
                  type="button"
                  aria-label={`Supprimer ${word}`}
                  className="inline-flex size-5 items-center justify-center rounded-sm hover:bg-black/10 cursor-pointer"
                  onClick={() => {
                    onWordsChange(removeCustomWord(words, index))
                  }}
                >
                  <XIcon className="size-3" strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
