import type { TimelineItem } from '../types'

const SIDE_LABELS: Record<string, string> = {
  red: 'rouge',
  blue: 'bleu',
}

function formatEventText(item: TimelineItem): string {
  const { type, eventType, payload } = item
  const playerName = item.playerName ?? (payload.playerName as string | undefined)

  if (type === 'chat') {
    return `${playerName ?? 'Joueur'} : ${(payload.content as string) ?? ''}`
  }

  switch (eventType) {
    case 'ROUND_STARTED': {
      const side = (payload.startingSide as string) ?? 'red'
      return `Tour de l'équipe ${SIDE_LABELS[side] ?? side}`
    }
    case 'CLUE_GIVEN': {
      const word = (payload.word as string) ?? '?'
      const number = (payload.number as number) ?? 0
      return `${playerName ?? 'L\'espion'} a donné l'indice « ${word} » pour ${number} mot${number > 1 ? 's' : ''}`
    }
    case 'WORD_SELECTED': {
      const word = (payload.word as string) ?? (payload.wordIndex !== undefined ? `mot #${payload.wordIndex}` : '?')
      return `${playerName ?? 'Un joueur'} a cliqué sur « ${word} »`
    }
    case 'WORD_HIGHLIGHTED': {
      const word = (payload.word as string) ?? (payload.wordIndex !== undefined ? `mot #${payload.wordIndex}` : '?')
      return `${playerName ?? 'Un joueur'} a mis en avant « ${word} »`
    }
    case 'WORD_UNHIGHLIGHTED': {
      const word = (payload.word as string) ?? (payload.wordIndex !== undefined ? `mot #${payload.wordIndex}` : '?')
      return `${playerName ?? 'Un joueur'} a retiré « ${word} »`
    }
    case 'TURN_PASSED': {
      const nextTurn = (payload.nextTurn as string) ?? 'blue'
      return `Tour de l'équipe ${SIDE_LABELS[nextTurn] ?? nextTurn}`
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
}

export function GameTimelineItem({ item }: GameTimelineItemProps) {
  const text = formatEventText(item)
  if (!text)
    return null

  const isChat = item.type === 'chat'

  return (
    <div
      className={`rounded-md px-2 py-1.5 text-sm ${isChat ? 'bg-muted/50' : 'text-muted-foreground'}`}
      data-testid={isChat ? 'timeline-chat' : 'timeline-event'}
    >
      <span className="text-xs text-muted-foreground/70">
        {new Date(item.createdAt).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })}
        {' · '}
      </span>
      {text}
    </div>
  )
}
