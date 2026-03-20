import { Button } from '@codenames/ui/components/primitives/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@codenames/ui/components/primitives/tooltip'
import { LogOut } from 'lucide-react'

interface GameHeaderLeaveButtonProps {
  onLeave: () => void
  isLeaving: boolean
}

export function GameHeaderLeaveButton({ onLeave, isLeaving }: GameHeaderLeaveButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={onLeave}
          disabled={isLeaving}
          aria-label="Quitter la partie"
        >
          <LogOut className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isLeaving ? 'Déconnexion...' : 'Quitter la partie'}
      </TooltipContent>
    </Tooltip>
  )
}
