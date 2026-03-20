import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@codenames/ui/components/primitives/tooltip'
import { cn } from '@codenames/ui/lib/utils'

export interface CardHighlightPlayer {
  playerId: string
  playerName: string
}

export interface CardHighlightsProps {
  highlights: CardHighlightPlayer[]
  className?: string
  isSpy?: boolean
}

function getInitial(name: string): string {
  const trimmed = name.trim()
  if (!trimmed)
    return '?'
  return trimmed[0].toUpperCase()
}

export function CardHighlights({ highlights, className, isSpy }: CardHighlightsProps) {
  if (highlights.length === 0)
    return null

  return (
    <div
      className={cn(
        'absolute left-2 top-2 z-10 flex flex-wrap gap-1',
        className,
      )}
    >
      {highlights.map(h => (
        <Tooltip key={h.playerId}>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'inline-flex size-4 items-center justify-center rounded border border-blue-dark text-[10px] font-medium text-white cursor-pointer',
                isSpy ? 'bg-black border-black' : 'bg-blue-dark border-blue-dark',
              )}
            >
              {getInitial(h.playerName)}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" align="center">
            {h.playerName}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
