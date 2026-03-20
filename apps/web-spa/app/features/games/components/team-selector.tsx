import type { Side } from '../types'
import { Button } from '@codenames/ui/components/primitives/button'

interface TeamSelectorProps {
  onSelectSide: (side: Side) => void
  disabled?: boolean
}

export function TeamSelector({
  onSelectSide,
  disabled = false,
}: TeamSelectorProps) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        onClick={() => onSelectSide('red')}
        disabled={disabled}
        variant="red"
      >
        Rouge
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={() => onSelectSide('blue')}
        disabled={disabled}
        variant="blue"
      >
        Bleue
      </Button>
    </div>
  )
}
