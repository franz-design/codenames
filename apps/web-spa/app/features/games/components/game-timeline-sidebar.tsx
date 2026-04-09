import type { TimelineItem } from '../types'
import { Button } from '@codenames/ui/components/primitives/button'
import { ChevronRight } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { GameChatInput } from './game-chat-input'
import { GameTimelineItem } from './game-timeline-item'

export interface GameTimelineSidebarProps {
  items: TimelineItem[]
  isLoading: boolean
  onSendMessage: (content: string) => void
  isSending: boolean
  /** Pour aligner les bulles de chat (soi à droite, les autres à gauche) */
  currentPlayerId?: string | null
  /** Joueur sans équipe en cours de partie : pas de chat jusqu'à assignation par l'hôte */
  isChatDisabled?: boolean
  className?: string
  id?: string
  onHideTimeline?: () => void
}

export function GameTimelineSidebar({
  items,
  isLoading,
  onSendMessage,
  isSending,
  currentPlayerId = null,
  isChatDisabled = false,
  className,
  id,
  onHideTimeline,
}: GameTimelineSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [items.length])

  return (
    <aside
      id={id}
      className={`hidden h-[calc(100%-34px)] min-w-64 flex-[1] flex-col border-1 rounded-lg mr-4 mt-4 bg-muted/20 lg:flex ${className ?? ''}`}
      aria-label="Historique et chat"
    >
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <h2 className="text-sm font-semibold">Historique & Chat</h2>
        {onHideTimeline != null && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 shrink-0"
            onClick={onHideTimeline}
            aria-expanded
            aria-controls={id}
            aria-label="Masquer l’historique et le chat"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 bg-white">
          {isLoading
            ? (
                <p className="text-muted-foreground text-sm">Chargement...</p>
              )
            : items.length === 0
              ? (
                  <p className="text-muted-foreground text-sm">Indices et clics apparaîtront ici.</p>
                )
              : (
                  <ul className="flex flex-col gap-1">
                    {items.map(item => (
                      <li key={item.id} className="w-full">
                        <GameTimelineItem item={item} currentPlayerId={currentPlayerId} />
                      </li>
                    ))}
                  </ul>
                )}
        </div>

        <div className="border-t p-2">
          {isChatDisabled && (
            <p className="mb-2 text-xs text-muted-foreground">
              Le chat sera disponible lorsque l&apos;hôte vous aura assigné à une équipe.
            </p>
          )}
          <GameChatInput
            onSend={onSendMessage}
            isPending={isSending}
            disabled={isChatDisabled}
            placeholder={
              isChatDisabled
                ? 'En attente d\'une équipe...'
                : 'Écrire un message...'
            }
          />
        </div>
      </div>
    </aside>
  )
}
