import type { GameStatePlayer } from '../types'
import { Badge } from '@codenames/ui/components/primitives/badge'
import { Button } from '@codenames/ui/components/primitives/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@codenames/ui/components/primitives/dropdown-menu'
import { HatGlasses, MoreVerticalIcon, UserXIcon } from 'lucide-react'

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
          <h3 className="mb-2 text-sm font-bold text-red">Équipe rouge</h3>
          <div className="flex gap-2 flex-wrap">
            {redPlayers.map(player => (
              <PlayerBlock
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
          </div>
        </div>
      )}

      {bluePlayers.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold text-blue">Équipe bleue</h3>
          <div className="flex gap-2 flex-wrap">
            {bluePlayers.map(player => (
              <PlayerBlock
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
          </div>
        </div>
      )}

      {unassignedPlayers.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold text-muted-foreground">
            Sans équipe
          </h3>
          <div className="flex gap-2 flex-wrap">
            {unassignedPlayers.map(player => (
              <PlayerBlock
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
          </div>
        </div>
      )}

      {players.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun joueur dans le lobby</p>
      )}
    </div>
  )
}

interface PlayerBlockProps {
  player: GameStatePlayer
  isCurrentPlayer: boolean
  canKick: boolean
  canDesignateSpy: boolean
  onKick: () => void
  onDesignateSpy?: () => void
  isKicking: boolean
  isDesignatingSpy: boolean
}

function PlayerBlock({
  player,
  isCurrentPlayer,
  canKick,
  canDesignateSpy,
  onKick,
  onDesignateSpy,
  isKicking,
  isDesignatingSpy,
}: PlayerBlockProps) {
  const showDropdown
    = (canKick && !isCurrentPlayer)
      || (canDesignateSpy && Boolean(player.side))

  return (
    <li className="flex items-center justify-between rounded-lg border px-3 py-1.5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{player.name}</span>
        {player.isSpy && (
          <Badge variant="secondary" className="py-1 bg-primary-foreground text-primary relative -right-[6px]">
            <HatGlasses className="size-4" />
          </Badge>
        )}
      </div>
      {showDropdown && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-6 relative -right-[6px]">
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
                <HatGlasses className="size-4" />
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
