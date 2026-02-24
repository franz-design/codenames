import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@codenames/ui/components/primitives/dropdown-menu'
import { Button } from '@codenames/ui/components/primitives/button'
import { Badge } from '@codenames/ui/components/primitives/badge'
import { MoreVerticalIcon, UserXIcon } from 'lucide-react'
import type { GameStatePlayer } from '../types'

interface LobbyPlayersListProps {
  players: GameStatePlayer[]
  currentPlayerId: string | null
  isCreator: boolean
  creatorToken: string | null
  onKickPlayer: (playerId: string) => void
  isKicking?: boolean
}

export function LobbyPlayersList({
  players,
  currentPlayerId,
  isCreator,
  creatorToken,
  onKickPlayer,
  isKicking = false,
}: LobbyPlayersListProps) {
  const canKick = isCreator && Boolean(creatorToken)
  const redPlayers = players.filter(p => p.side === 'red')
  const bluePlayers = players.filter(p => p.side === 'blue')
  const unassignedPlayers = players.filter(p => !p.side)

  return (
    <div className="space-y-4">
      {redPlayers.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-red-700">Équipe rouge</h3>
          <ul className="space-y-2">
            {redPlayers.map(player => (
              <PlayerRow
                key={player.id}
                player={player}
                isCurrentPlayer={player.id === currentPlayerId}
                canKick={canKick}
                onKick={() => onKickPlayer(player.id)}
                isKicking={isKicking}
              />
            ))}
          </ul>
        </div>
      )}

      {bluePlayers.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-blue-700">Équipe bleue</h3>
          <ul className="space-y-2">
            {bluePlayers.map(player => (
              <PlayerRow
                key={player.id}
                player={player}
                isCurrentPlayer={player.id === currentPlayerId}
                canKick={canKick}
                onKick={() => onKickPlayer(player.id)}
                isKicking={isKicking}
              />
            ))}
          </ul>
        </div>
      )}

      {unassignedPlayers.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Sans équipe
          </h3>
          <ul className="space-y-2">
            {unassignedPlayers.map(player => (
              <PlayerRow
                key={player.id}
                player={player}
                isCurrentPlayer={player.id === currentPlayerId}
                canKick={canKick}
                onKick={() => onKickPlayer(player.id)}
                isKicking={isKicking}
              />
            ))}
          </ul>
        </div>
      )}

      {players.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun joueur dans le lobby</p>
      )}
    </div>
  )
}

interface PlayerRowProps {
  player: GameStatePlayer
  isCurrentPlayer: boolean
  canKick: boolean
  onKick: () => void
  isKicking: boolean
}

function PlayerRow({
  player,
  isCurrentPlayer,
  canKick,
  onKick,
  isKicking,
}: PlayerRowProps) {
  const canKickThisPlayer = canKick && !isCurrentPlayer

  return (
    <li className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="font-medium">{player.name}</span>
        {isCurrentPlayer && (
          <Badge variant="secondary" className="text-xs">
            Vous
          </Badge>
        )}
        {player.isSpy && (
          <Badge variant="outline" className="text-xs">
            Espion
          </Badge>
        )}
      </div>
      {canKickThisPlayer && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreVerticalIcon className="size-4" />
              <span className="sr-only">Options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onClick={onKick}
              disabled={isKicking}
            >
              <UserXIcon className="size-4" />
              Éjecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  )
}
