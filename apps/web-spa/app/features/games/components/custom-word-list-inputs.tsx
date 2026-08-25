import type { KeyboardEvent } from 'react'
import { Button, buttonVariants } from '@codenames/ui/components/primitives/button'
import { Input } from '@codenames/ui/components/primitives/input'
import { XIcon } from '@codenames/ui/icons'
import { cn } from '@codenames/ui/lib/utils'
import { useRef, useState } from 'react'
import { CUSTOM_WORD_MAX_LENGTH } from '../types'
import { addCustomWord, removeCustomWord } from '../utils/custom-word-list-rows'

interface CustomWordListInputsProps {
  words: string[]
  onWordsChange: (words: string[]) => void
}

export function CustomWordListInputs({ words, onWordsChange }: CustomWordListInputsProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [draft, setDraft] = useState('')

  const trimmedDraft = draft.trim()
  const canAdd = trimmedDraft.length > 0

  const handleAdd = (): void => {
    if (!canAdd)
      return

    onWordsChange(addCustomWord(words, draft))
    setDraft('')
    inputRef.current?.focus()
  }

  const handleDraftKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== 'Enter')
      return

    event.preventDefault()
    handleAdd()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={draft}
          maxLength={CUSTOM_WORD_MAX_LENGTH}
          placeholder="Ajouter un mot"
          aria-label="Nouveau mot custom"
          className="py-2 h-auto"
          onChange={(event) => {
            setDraft(event.target.value)
          }}
          onKeyDown={handleDraftKeyDown}
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
      )}
    </div>
  )
}
