import type { GameStatePlayer, RoundState, Side } from '../types'
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
  round: RoundState
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
  round,
  className,
}: TeamPlayersCardProps) {
  const spy = getSpy(players)
  const operatives = getOperatives(players)
  const total = round.wordsTotalBySide[side]
  const remaining = round.wordsRemainingBySide[side]
  const found = total - remaining
  const progressRatio = total > 0 ? found / total : 0

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
        {total > 0 && (
          <div className="mt-8">
            <p className="mb-2 tracking-widest text-center text-xs font-semibold tabular-nums text-white">
              {found}
              /
              {total}
            </p>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-white/25"
              role="progressbar"
              aria-valuenow={found}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label={`Mots équipe trouvés : ${found} sur ${total}`}
            >
              <div
                className="h-full rounded-full bg-white transition-[width] duration-300 ease-out"
                style={{ width: `${progressRatio * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
