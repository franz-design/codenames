import { Button } from '@codenames/ui/components/primitives/button'
import { Input } from '@codenames/ui/components/primitives/input'
import { useEffect, useRef } from 'react'

export interface GameChatInputProps {
  onSend: (content: string) => void
  isPending?: boolean
  disabled?: boolean
  placeholder?: string
}

export function GameChatInput({
  onSend,
  isPending = false,
  disabled = false,
  placeholder = 'Écrire un message...',
}: GameChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isPending && !disabled)
      inputRef.current?.focus()
  }, [isPending, disabled])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = inputRef.current?.value?.trim()
    if (!value || isPending || disabled)
      return
    onSend(value)
    if (inputRef.current)
      inputRef.current.value = ''
  }

  return (
    <form
      className="flex gap-2"
      onSubmit={handleSubmit}
    >
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        maxLength={500}
        disabled={disabled || isPending}
        className="flex-1 [&:disabled]:opacity-100"
        aria-label="Message du chat"
        autoFocus={!disabled}
      />
      <Button
        type="submit"
        size="sm"
        disabled={disabled || isPending}
      >
        Envoyer
      </Button>
    </form>
  )
}
