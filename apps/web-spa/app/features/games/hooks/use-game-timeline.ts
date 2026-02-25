import type { TimelineItem } from '../types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createGamesApiClient } from '../utils/games-api'
import { useGameWebSocket } from './use-game-websocket'

const TIMELINE_PAGE_SIZE = 100

function sortByCreatedAt(items: TimelineItem[]): TimelineItem[] {
  return [...items].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
}

function isRelevantItem(item: TimelineItem): boolean {
  if (item.type === 'chat')
    return true
  return item.eventType === 'CLUE_GIVEN' || item.eventType === 'WORD_SELECTED'
}

export interface UseGameTimelineOptions {
  gameId: string | null
  playerId: string | null
  playerName?: string | null
  enabled?: boolean
}

export interface UseGameTimelineResult {
  items: TimelineItem[]
  isLoading: boolean
  sendMessage: (content: string) => void
  isSending: boolean
}

export function useGameTimeline({
  gameId,
  playerId,
  playerName = null,
  enabled = true,
}: UseGameTimelineOptions): UseGameTimelineResult {
  const queryClient = useQueryClient()
  const [wsItems, setWsItems] = useState<TimelineItem[]>([])
  const seenIdsRef = useRef<Set<string>>(new Set())

  const { data: timelineData } = useQuery({
    queryKey: ['gameTimeline', gameId],
    queryFn: () => {
      if (!gameId)
        throw new Error('Missing gameId')
      return createGamesApiClient(playerId ?? '').getTimeline(gameId, TIMELINE_PAGE_SIZE, 0)
    },
    enabled: Boolean(enabled && gameId && playerId),
  })

  const handleTimelineItem = useCallback((item: TimelineItem) => {
    if (seenIdsRef.current.has(item.id))
      return
    seenIdsRef.current.add(item.id)
    setWsItems(prev => [...prev, item])
  }, [])

  useGameWebSocket({
    gameId,
    playerId,
    onTimelineItem: handleTimelineItem,
    enabled: Boolean(enabled && gameId),
  })

  useEffect(() => {
    if (timelineData?.data) {
      timelineData.data.forEach(item => seenIdsRef.current.add(item.id))
    }
  }, [timelineData])

  const items = useMemo(() => {
    const fromQuery = (timelineData?.data ?? []).filter(isRelevantItem)
    const merged = [...fromQuery]
    const fromQueryIds = new Set(fromQuery.map(i => i.id))
    wsItems.filter(isRelevantItem).forEach((item) => {
      if (!fromQueryIds.has(item.id)) {
        merged.push(item)
        fromQueryIds.add(item.id)
      }
    })
    return sortByCreatedAt(merged)
  }, [timelineData?.data, wsItems])

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: (content: string) => {
      if (!gameId || !playerId)
        throw new Error('Missing gameId or playerId')
      return createGamesApiClient(playerId).sendChatMessage(gameId, content)
    },
    onMutate: async (content) => {
      const optimisticItem: TimelineItem = {
        id: `optimistic-${Date.now()}`,
        type: 'chat',
        payload: { content, playerName: playerName ?? undefined },
        playerName: playerName ?? undefined,
        triggeredBy: playerId,
        createdAt: new Date().toISOString(),
      }
      setWsItems(prev => [...prev, optimisticItem])
      return { optimisticItem }
    },
    onSuccess: async (_, __, context) => {
      await queryClient.refetchQueries({ queryKey: ['gameTimeline', gameId] })
      if (context?.optimisticItem)
        setWsItems(prev => prev.filter(i => i.id !== context.optimisticItem.id))
    },
    onError: (_, __, context) => {
      if (context?.optimisticItem)
        setWsItems(prev => prev.filter(i => i.id !== context.optimisticItem.id))
    },
  })

  return {
    items,
    isLoading: !timelineData && Boolean(enabled && gameId),
    sendMessage: (content: string) => sendMessage(content),
    isSending,
  }
}
