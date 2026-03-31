import type { GameState } from '../types'
import { Button } from '@codenames/ui/components/primitives/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@codenames/ui/components/primitives/dropdown-menu'
import { toast } from '@codenames/ui/components/primitives/sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGamesApiClient } from '../utils/games-api'

export interface GamePendingPlayersDropdownProps {
  gameId: string
  playerId: string
  creatorToken: string
  gameState: GameState
}

function getUnassignedPlayers(gameState: GameState) {
  if (gameState.status !== 'PLAYING')
    return []
  return gameState.players.filter(p => p.side == null)
}

export function GamePendingPlayersDropdown({
  gameId,
  playerId,
  creatorToken,
  gameState,
}: GamePendingPlayersDropdownProps) {
  const queryClient = useQueryClient()
  const pending = getUnassignedPlayers(gameState)
  const api = createGamesApiClient(playerId)

  const { mutate: assignSide, isPending } = useMutation({
    mutationFn: ({
      targetPlayerId,
      side,
    }: {
      targetPlayerId: string
      side: 'red' | 'blue'
    }) => api.assignPlayerSideByCreator(gameId, targetPlayerId, side, creatorToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['gameState', gameId, playerId] })
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Impossible d\'assigner le joueur',
      )
    },
  })

  if (pending.length === 0)
    return null

  const label
    = pending.length === 1
      ? '1 joueur en attente'
      : `${pending.length} joueurs en attente`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="shrink-0 rounded-full bg-primary-foreground px-4 py-2 text-xs font-medium text-primary backdrop-blur-sm transition-colors hover:bg-primary-foreground/80 cursor-pointer"
        >
          {label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-3 rounded-lg">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Assigner à une équipe
        </p>
        <ul className="flex flex-col gap-3">
          {pending.map(p => (
            <li
              key={p.id}
              className="flex flex-col gap-2 rounded-md border border-border p-2"
            >
              <span className="truncate text-sm font-medium">{p.name}</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="red"
                  className="flex-1"
                  disabled={isPending}
                  onClick={() =>
                    assignSide({ targetPlayerId: p.id, side: 'red' })}
                >
                  Rouge
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="blue"
                  className="flex-1"
                  disabled={isPending}
                  onClick={() =>
                    assignSide({ targetPlayerId: p.id, side: 'blue' })}
                >
                  Bleue
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
