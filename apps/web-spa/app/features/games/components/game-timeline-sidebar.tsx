import type { TimelineItem } from '../types'
import { useEffect, useRef } from 'react'
import { GameChatInput } from './game-chat-input'
import { GameTimelineItem } from './game-timeline-item'

export interface GameTimelineSidebarProps {
  items: TimelineItem[]
  isLoading: boolean
  onSendMessage: (content: string) => void
  isSending: boolean
  className?: string
}

export function GameTimelineSidebar({
  items,
  isLoading,
  onSendMessage,
  isSending,
  className,
}: GameTimelineSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [items.length])

  return (
    <aside
      className={`hidden h-full max-h-[90vh] min-h-0 min-w-64 flex-[1] shrink-0 flex-col border-1 rounded-lg mr-4 mt-4 bg-muted/20 lg:flex ${className ?? ''}`}
      aria-label="Historique et chat"
    >
      <div className="border-b px-3 py-2">
        <h2 className="text-sm font-semibold">Historique & Chat</h2>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-2">
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
                      <li key={item.id}>
                        <GameTimelineItem item={item} />
                      </li>
                    ))}
                  </ul>
                )}
        </div>

        <div className="border-t p-2">
          <GameChatInput
            onSend={onSendMessage}
            isPending={isSending}
            placeholder="Écrire un message..."
          />
        </div>
      </div>
    </aside>
  )
}
