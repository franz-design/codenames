import type { GameStatePlayer, Side } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '@codenames/ui/components/primitives/card'
import { cn } from '@codenames/ui/lib/utils'

const SIDE_LABELS: Record<Side, string> = {
  red: 'rouge',
  blue: 'bleue',
}

const SIDE_STYLES: Record<Side, string> = {
  red: 'bg-red border-red-dark text-white shadow-[4px_4px_0px_0px_#A11734]',
  blue: 'bg-blue border-blue-dark text-white shadow-[4px_4px_0px_0px_#42689F]',
}

const HEADER_STYLES: Record<Side, string> = {
  red: 'border-b-2 border-red-dark bg-red-dark/60',
  blue: 'border-b-2 border-blue-dark bg-blue-dark/60',
}

export interface TeamPlayersCardProps {
  side: Side
  players: GameStatePlayer[]
  className?: string
}

function getSpy(players: GameStatePlayer[]): GameStatePlayer | undefined {
  return players.find(p => p.isSpy)
}

function getOperatives(players: GameStatePlayer[]): GameStatePlayer[] {
  return players.filter(p => !p.isSpy)
}

export function TeamPlayersCard({
  side,
  players,
  className,
}: TeamPlayersCardProps) {
  const spy = getSpy(players)
  const operatives = getOperatives(players)

  return (
    <Card className={cn('flex flex-col py-0 gap-0 overflow-hidden h-auto', SIDE_STYLES[side], className)}>
      <CardHeader className={cn('px-3 py-3 w-full border-b border-primary-border', HEADER_STYLES[side])}>
        <CardTitle className={cn('text-sm w-full text-center font-bold')}>
          Équipe
          {' '}
          {SIDE_LABELS[side]}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-4 pt-4 pb-6">
        {spy && (
          <div>
            <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-destructive">
              Espion
            </p>
            <p className="truncate text-xs font-medium">{spy.name}</p>
          </div>
        )}
        <div>
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-destructive">
            Agents
          </p>
          <ul className="flex flex-col gap-0.5">
            {operatives.length > 0
              ? operatives.map(p => (
                  <li key={p.id} className="truncate text-xs">
                    {p.name}
                  </li>
                ))
              : (
                  <li className="text-xs text-muted-foreground italic">
                    Aucun
                  </li>
                )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
