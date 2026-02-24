import type { GameStatePlayer, Side } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '@codenames/ui/components/primitives/card'
import { cn } from '@codenames/ui/lib/utils'

const SIDE_LABELS: Record<Side, string> = {
  red: 'Rouge',
  blue: 'Bleu',
}

const SIDE_STYLES: Record<Side, string> = {
  red: 'border-red-500 bg-red-50/50 dark:bg-red-950/20',
  blue: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20',
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
    <Card className={cn('flex flex-col', SIDE_STYLES[side], className)}>
      <CardHeader className="px-3 py-2">
        <CardTitle className="text-sm">
          Équipe {SIDE_LABELS[side]}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-3 py-2 pt-0">
        {spy && (
          <div>
            <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Espion
            </p>
            <p className="truncate text-xs font-medium">{spy.name}</p>
          </div>
        )}
        <div>
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Opératifs
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
