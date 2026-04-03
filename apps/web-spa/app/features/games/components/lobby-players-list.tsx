import type { GameStatePlayer, Side } from '../types'
import { Badge } from '@codenames/ui/components/primitives/badge'
import { Button } from '@codenames/ui/components/primitives/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@codenames/ui/components/primitives/dropdown-menu'
import { cn } from '@codenames/ui/lib/utils'
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
  currentPlayer: GameStatePlayer | null
  onSelectSide: (side: Side) => void
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
  currentPlayer,
  onSelectSide,
}: LobbyPlayersListProps) {
  const canKick = isCreator && Boolean(creatorToken)
  const canDesignateSpy = isCreator && Boolean(creatorToken) && Boolean(onDesignateSpy)
  const redPlayers = players.filter(p => p.side === 'red')
  const bluePlayers = players.filter(p => p.side === 'blue')
  const unassignedPlayers = players.filter(p => !p.side)

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-red rounded-lg p-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="mb-2 text-sm font-bold text-white">Équipe rouge</h3>
          {(!currentPlayer?.side || currentPlayer?.side === 'blue') && (
            <Button variant="red" size="sm" onClick={() => onSelectSide('red')}>Rejoindre</Button>
          )}
        </div>
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

      <div className="bg-blue rounded-lg p-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="mb-2 text-sm font-bold text-white">Équipe bleue</h3>
          {(!currentPlayer?.side || currentPlayer?.side === 'red') && (
            <Button variant="blue" size="sm" onClick={() => onSelectSide('blue')}>Rejoindre</Button>
          )}
        </div>
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

      {unassignedPlayers.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold text-black">
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
                className="border border-black"
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
  className?: string
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
  className,
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
    <li className={cn('flex items-center justify-between rounded-lg bg-white px-3 py-1.5', className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{player.name}</span>
        {player.isSpy && (
          <Badge variant="secondary" className={cn('py-1 relative -right-[6px]', player.side === 'red' ? 'bg-red text-white' : 'bg-blue text-white')}>
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
