import { Button } from '@codenames/ui/components/primitives/button'

interface SpyDesignationProps {
  isSpy: boolean
  onToggleSpy: () => void
  disabled?: boolean
}

export function SpyDesignation({
  isSpy,
  onToggleSpy,
  disabled = false,
}: SpyDesignationProps) {
  return (
    <Button
      type="button"
      onClick={onToggleSpy}
      disabled={disabled}
    >
      {isSpy ? 'Espion' : 'Devenir espion'}
    </Button>
  )
}
