import type { GameStatePlayer } from '../types'
import { Badge } from '@codenames/ui/components/primitives/badge'
import { Button } from '@codenames/ui/components/primitives/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@codenames/ui/components/primitives/dropdown-menu'
import { EyeIcon, MoreVerticalIcon, UserXIcon } from 'lucide-react'

interface LobbyPlayersListProps {
  players: GameStatePlayer[]
  currentPlayerId: string | null
  isCreator: boolean
  creatorToken: string | null
  onKickPlayer: (playerId: string) => void
  onDesignateSpy?: (playerId: string) => void
  isKicking?: boolean
  isDesignatingSpy?: boolean
}

export function LobbyPlayersList({
  players,
  currentPlayerId,
  isCreator,
  creatorToken,
  onKickPlayer,
  onDesignateSpy,
  isKicking = false,
  isDesignatingSpy = false,
}: LobbyPlayersListProps) {
  const canKick = isCreator && Boolean(creatorToken)
  const canDesignateSpy = isCreator && Boolean(creatorToken) && Boolean(onDesignateSpy)
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
                canDesignateSpy={canDesignateSpy}
                onKick={() => onKickPlayer(player.id)}
                onDesignateSpy={onDesignateSpy ? () => onDesignateSpy(player.id) : undefined}
                isKicking={isKicking}
                isDesignatingSpy={isDesignatingSpy}
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
                canDesignateSpy={canDesignateSpy}
                onKick={() => onKickPlayer(player.id)}
                onDesignateSpy={onDesignateSpy ? () => onDesignateSpy(player.id) : undefined}
                isKicking={isKicking}
                isDesignatingSpy={isDesignatingSpy}
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
                canDesignateSpy={false}
                onKick={() => onKickPlayer(player.id)}
                isKicking={isKicking}
                isDesignatingSpy={isDesignatingSpy}
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
  canDesignateSpy: boolean
  onKick: () => void
  onDesignateSpy?: () => void
  isKicking: boolean
  isDesignatingSpy: boolean
}

function PlayerRow({
  player,
  isCurrentPlayer,
  canKick,
  canDesignateSpy,
  onKick,
  onDesignateSpy,
  isKicking,
  isDesignatingSpy,
}: PlayerRowProps) {
  const showDropdown
    = (canKick && !isCurrentPlayer)
      || (canDesignateSpy && Boolean(player.side))

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
      {showDropdown && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreVerticalIcon className="size-4" />
              <span className="sr-only">Options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canDesignateSpy && player.side && onDesignateSpy && (
              <DropdownMenuItem
                onClick={onDesignateSpy}
                disabled={isDesignatingSpy}
              >
                <EyeIcon className="size-4" />
                Désigner espion
              </DropdownMenuItem>
            )}
            {canKick && !isCurrentPlayer && (
              <DropdownMenuItem
                variant="destructive"
                onClick={onKick}
                disabled={isKicking}
              >
                <UserXIcon className="size-4" />
                Éjecter
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  )
}
