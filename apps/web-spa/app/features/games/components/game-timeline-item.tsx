import type { ReactNode } from 'react'
import type { CardType, Side, TimelineItem } from '../types'
import { cn } from '@codenames/ui/lib/utils'

const SIDE_LABELS: Record<string, string> = {
  red: 'rouge',
  blue: 'bleu',
}

const TEAM_TURN_TEXT_CLASS: Record<Side, string> = {
  red: 'text-red',
  blue: 'text-blue',
}

const CHAT_BUBBLE_BG_BY_SIDE: Record<Side, string> = {
  red: 'bg-red text-white',
  blue: 'bg-blue text-white',
}

const WORD_CARD_TYPE_TEXT_CLASS: Record<CardType, string> = {
  red: 'text-red',
  blue: 'text-blue',
  neutral: 'text-neutral-foreground',
  black: 'text-black',
}

function isCardType(value: unknown): value is CardType {
  return value === 'red' || value === 'blue' || value === 'neutral' || value === 'black'
}

function isSide(value: unknown): value is Side {
  return value === 'red' || value === 'blue'
}

function getChatPlayerSide(item: TimelineItem): Side | null {
  if (item.type !== 'chat')
    return null
  return isSide(item.payload.side) ? item.payload.side : null
}

function renderEventContent(item: TimelineItem): ReactNode {
  const { type, eventType, payload } = item
  const playerName = item.playerName ?? (payload.playerName as string | undefined)

  if (type === 'chat') {
    return `${(payload.content as string) ?? ''}`
  }

  switch (eventType) {
    case 'ROUND_STARTED': {
      const sideRaw = (payload.startingSide as string) ?? 'red'
      const side = isSide(sideRaw) ? sideRaw : 'red'
      const label = SIDE_LABELS[side] ?? side
      return (
        <span className={cn('font-semibold not-italic', TEAM_TURN_TEXT_CLASS[side])}>
          {`Tour de l'équipe ${label}`}
        </span>
      )
    }
    case 'CLUE_GIVEN': {
      const word = (payload.word as string) ?? '?'
      const number = (payload.number as number) ?? 0
      return `${playerName ?? 'L\'espion'} a donné l'indice « ${word} » pour ${number} mot${number > 1 ? 's' : ''}`
    }
    case 'WORD_SELECTED': {
      const word = (payload.word as string) ?? (payload.wordIndex !== undefined ? `mot #${payload.wordIndex}` : '?')
      const cardType = isCardType(payload.cardType) ? payload.cardType : null
      const prefix = `${playerName ?? 'Un joueur'} a cliqué sur « `
      const suffix = ' »'
      if (!cardType) {
        return `${prefix}${word}${suffix}`
      }
      return (
        <>
          <span>{prefix}</span>
          <span className={cn('font-semibold not-italic', WORD_CARD_TYPE_TEXT_CLASS[cardType])}>{word}</span>
          <span>{suffix}</span>
        </>
      )
    }
    case 'TURN_PASSED': {
      const nextRaw = (payload.nextTurn as string) ?? 'blue'
      const side = isSide(nextRaw) ? nextRaw : 'blue'
      const label = SIDE_LABELS[side] ?? nextRaw
      return (
        <span className={cn('font-semibold not-italic', TEAM_TURN_TEXT_CLASS[side])}>
          {`Tour de l'équipe ${label}`}
        </span>
      )
    }
    case 'GAME_FINISHED': {
      const winningSide = payload.winningSide as string | undefined
      const losingSide = payload.losingSide as string | undefined
      if (winningSide)
        return `Victoire de l'équipe ${SIDE_LABELS[winningSide] ?? winningSide} !`
      if (losingSide)
        return `Défaite — L'Assassin a été contacté`
      return 'Partie terminée'
    }
    case 'GAME_RESTARTED':
      return 'Nouvelle partie'
    case 'PLAYER_JOINED':
      return `${payload.playerName ?? 'Un joueur'} a rejoint la partie`
    case 'PLAYER_LEFT':
      return 'Un joueur a quitté la partie'
    case 'PLAYER_CHOSE_SIDE':
      return `${playerName ?? 'Un joueur'} a rejoint l'équipe ${SIDE_LABELS[(payload.side as string) ?? 'red'] ?? '?'}`
    case 'PLAYER_DESIGNATED_SPY':
      return `${playerName ?? 'Un joueur'} est l'espion de l'équipe ${SIDE_LABELS[(payload.side as string) ?? 'red'] ?? '?'}`
    default:
      return ''
  }
}

export interface GameTimelineItemProps {
  item: TimelineItem
  currentPlayerId?: string | null
}

const CHAT_BUBBLE_BASE_CLASS
  = 'flex flex-col gap-1 rounded-md px-3 py-2 text-sm break-words relative bottom-[8px]'

export function GameTimelineItem({ item, currentPlayerId = null }: GameTimelineItemProps) {
  const content = renderEventContent(item)
  if (content === '' || content === null)
    return null

  const isChat = item.type === 'chat'
  const playerName = item.playerName
  const chatPlayerSide = getChatPlayerSide(item)

  if (!isChat) {
    return (
      <div
        className="flex w-full flex-col items-center px-2 py-1.5 text-sm"
        data-testid="timeline-event"
      >
        <div className="max-w-full text-center italic text-muted-foreground/90">
          {content}
        </div>
      </div>
    )
  }

  const isOwnMessage
    = Boolean(currentPlayerId && item.triggeredBy && item.triggeredBy === currentPlayerId)

  const chatBubbleBgClass
    = chatPlayerSide != null
      ? CHAT_BUBBLE_BG_BY_SIDE[chatPlayerSide]
      : 'bg-blue-light text-white'

  return (
    <div
      className={cn(
        'flex w-full px-2 py-1.5 text-sm',
        isOwnMessage ? 'justify-end' : 'justify-start',
      )}
      data-testid="timeline-chat"
    >
      <div
        className={cn(
          CHAT_BUBBLE_BASE_CLASS,
          chatBubbleBgClass,
          'min-w-[80px] max-w-[min(100%,18rem)]',
          isOwnMessage ? 'rounded-tr-none' : 'rounded-tl-none',
        )}
      >
        {playerName && (
          <span className="font-bold text-white">{playerName}</span>
        )}
        {content}
      </div>
    </div>
  )
}
