import { Button } from '@codenames/ui/components/primitives/button'
import type { Side } from '../types'

interface TeamSelectorProps {
  currentSide: Side | null
  onSelectSide: (side: Side) => void
  disabled?: boolean
}

export function TeamSelector({
  currentSide,
  onSelectSide,
  disabled = false,
}: TeamSelectorProps) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant={currentSide === 'red' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelectSide('red')}
        disabled={disabled}
        className={
          currentSide === 'red'
            ? 'border-red-500 bg-red-600 text-white hover:bg-red-700 hover:text-white'
            : 'border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800'
        }
      >
        Rouge
      </Button>
      <Button
        type="button"
        variant={currentSide === 'blue' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelectSide('blue')}
        disabled={disabled}
        className={
          currentSide === 'blue'
            ? 'border-blue-500 bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
            : 'border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800'
        }
      >
        Bleu
      </Button>
    </div>
  )
}
