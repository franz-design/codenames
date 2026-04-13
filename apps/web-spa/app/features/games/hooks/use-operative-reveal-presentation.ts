import type { MutableRefObject } from 'react'
import type { GameState, RevealedWord, RoundState, Side, TimelineItem } from '../types'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'

/**
 * Subset of {@link RoundState} deferred for operative UI until the card reveal overlay is idle.
 * The grid keeps the server {@link RoundState} for `revealedWords` / animation detection.
 */
export interface OperativeRevealPresentationFields {
  revealedWords: RevealedWord[]
  wordsRemainingBySide: RoundState['wordsRemainingBySide']
  guessesRemaining: number
  currentTurn: Side
  currentClue: RoundState['currentClue']
  highlights: RoundState['highlights']
  turnStartedAt: RoundState['turnStartedAt']
}

function emptyPresentationFields(): OperativeRevealPresentationFields {
  return {
    revealedWords: [],
    wordsRemainingBySide: { red: 0, blue: 0 },
    guessesRemaining: 0,
    currentTurn: 'red',
    currentClue: null,
    highlights: {},
    turnStartedAt: null,
  }
}

export function extractOperativePresentationFields(
  source: RoundState,
): OperativeRevealPresentationFields {
  return {
    revealedWords: source.revealedWords,
    wordsRemainingBySide: source.wordsRemainingBySide,
    guessesRemaining: source.guessesRemaining,
    currentTurn: source.currentTurn,
    currentClue: source.currentClue,
    highlights: { ...source.highlights },
    turnStartedAt: source.turnStartedAt,
  }
}

export function mergePresentationFieldsIntoRound(
  serverRound: RoundState,
  fields: OperativeRevealPresentationFields,
): RoundState {
  return {
    ...serverRound,
    revealedWords: fields.revealedWords,
    wordsRemainingBySide: fields.wordsRemainingBySide,
    guessesRemaining: fields.guessesRemaining,
    currentTurn: fields.currentTurn,
    currentClue: fields.currentClue,
    highlights: { ...fields.highlights },
    turnStartedAt: fields.turnStartedAt,
  }
}

function revealedWordIndexSet(revealedWords: RevealedWord[]): Set<number> {
  return new Set(revealedWords.map(r => r.wordIndex))
}

/** True while the server round lists a revealed word not yet mirrored in operative presentation (during / just before reveal anim). */
export function hasUncommittedOperativeRevealLag(
  serverRound: RoundState,
  committedFields: OperativeRevealPresentationFields,
): boolean {
  const committedSet = revealedWordIndexSet(committedFields.revealedWords)
  for (const r of serverRound.revealedWords) {
    if (!committedSet.has(r.wordIndex))
      return true
  }
  return false
}

export function getWordIndexFromWordSelectedTimelineItem(item: TimelineItem): number | null {
  if (item.type !== 'event' || item.eventType !== 'WORD_SELECTED')
    return null
  const idx = item.payload.wordIndex
  if (typeof idx === 'number')
    return Number.isInteger(idx) ? idx : null
  if (typeof idx === 'string') {
    const parsed = Number.parseInt(idx, 10)
    return Number.isInteger(parsed) ? parsed : null
  }
  return null
}

export interface FilterTimelineOperativeLagOptions {
  hideGameFinished?: boolean
  /**
   * While a reveal is pending, hide only `TURN_PASSED` lines **after** the `WORD_SELECTED` of the
   * word(s) not yet committed — older “tour équipe …” lines stay visible.
   */
  hideTurnPassed?: boolean
}

function getPendingRevealWordIndices(
  serverRound: RoundState,
  committedFields: OperativeRevealPresentationFields,
): Set<number> {
  const serverSet = revealedWordIndexSet(serverRound.revealedWords)
  const committedSet = revealedWordIndexSet(committedFields.revealedWords)
  const pending = new Set<number>()
  for (const idx of serverSet) {
    if (!committedSet.has(idx))
      pending.add(idx)
  }
  return pending
}

function getLatestWordSelectedTimeMsForWordIndices(
  items: TimelineItem[],
  wordIndices: Set<number>,
): number | null {
  let maxMs: number | null = null
  for (const item of items) {
    const wi = getWordIndexFromWordSelectedTimelineItem(item)
    if (wi === null || !wordIndices.has(wi))
      continue
    const t = Date.parse(item.createdAt)
    if (Number.isNaN(t))
      continue
    if (maxMs === null || t > maxMs)
      maxMs = t
  }
  return maxMs
}

/**
 * Shows `WORD_SELECTED` only once that word is in operative-committed `revealedWords` (after reveal
 * anim). Hides the line while the timeline event is ahead of presentation or server round (avoids a
 * flash when WS delivers the event before `revealedWords` updates). Optionally hides spoilers after
 * that selection only.
 */
export function filterTimelineItemsForOperativeRevealLag(
  items: TimelineItem[],
  serverRound: RoundState,
  committedFields: OperativeRevealPresentationFields,
  options?: FilterTimelineOperativeLagOptions,
): TimelineItem[] {
  const committedSet = revealedWordIndexSet(committedFields.revealedWords)
  const pendingRevealWordIndices = getPendingRevealWordIndices(serverRound, committedFields)
  const hasPendingReveal = pendingRevealWordIndices.size > 0
  let result = items.filter((item) => {
    const wi = getWordIndexFromWordSelectedTimelineItem(item)
    if (item.type === 'event' && item.eventType === 'WORD_SELECTED' && wi === null)
      return !hasPendingReveal
    if (wi === null)
      return true
    return committedSet.has(wi)
  })
  if (options?.hideGameFinished)
    result = result.filter(i => i.eventType !== 'GAME_FINISHED')
  if (options?.hideTurnPassed) {
    if (pendingRevealWordIndices.size > 0) {
      const wordSelectedThresholdMs = getLatestWordSelectedTimeMsForWordIndices(items, pendingRevealWordIndices)
      if (wordSelectedThresholdMs != null) {
        result = result.filter((i) => {
          if (i.eventType !== 'TURN_PASSED')
            return true
          const t = Date.parse(i.createdAt)
          if (Number.isNaN(t))
            return true
          return t <= wordSelectedThresholdMs
        })
      }
    }
  }
  return result
}

export interface UseOperativeRevealPresentationOptions {
  round: RoundState | null
  viewMode: 'spy' | 'operative'
  gameStatus: GameState['status']
  /**
   * Updated synchronously in the same handler as {@link isRevealOverlayIdle} state so the parent
   * layout effect reads the value the grid just set (state can still be stale for one layout pass).
   */
  revealOverlayIdleRef: MutableRefObject<boolean>
  /** Mirrors grid idle; keep in sync with the ref and include in handlers so layout effects re-run. */
  isRevealOverlayIdle: boolean
  timelineItems: TimelineItem[]
}

export interface UseOperativeRevealPresentationResult {
  /** Server round for grid / logic; this for turn strip, team counts, guess bubble, etc. */
  roundForDerivedUi: RoundState | null
  timelineItemsForSidebar: TimelineItem[]
  /** Defer finished chrome / match data-driven timeline lag while a reveal is not yet committed. */
  hasOperativeRevealPresentationLag: boolean
}

/**
 * Defers operative-facing derived UI until the reveal overlay is idle: team counts, turn / clue /
 * timer strip, highlights copy, and timeline lines that would spoil the reveal (`WORD_SELECTED`
 * color; `TURN_PASSED` only after the pending `WORD_SELECTED`; `GAME_FINISHED` when finished).
 */
export function useOperativeRevealPresentation({
  round,
  viewMode,
  gameStatus,
  revealOverlayIdleRef,
  isRevealOverlayIdle,
  timelineItems,
}: UseOperativeRevealPresentationOptions): UseOperativeRevealPresentationResult {
  const isOperative = viewMode === 'operative'

  const [committedFields, setCommittedFields] = useState<OperativeRevealPresentationFields>(() =>
    round ? extractOperativePresentationFields(round) : emptyPresentationFields(),
  )

  const roundIdRef = useRef<string | null>(null)
  const hasObservedBusySinceLagRef = useRef(false)

  useLayoutEffect(() => {
    if (!round)
      return

    if (roundIdRef.current !== round.id) {
      roundIdRef.current = round.id
      hasObservedBusySinceLagRef.current = false
      setCommittedFields(extractOperativePresentationFields(round))
      return
    }

    if (!isOperative) {
      hasObservedBusySinceLagRef.current = false
      setCommittedFields(extractOperativePresentationFields(round))
      return
    }

    const hasLag = hasUncommittedOperativeRevealLag(round, committedFields)
    if (!hasLag) {
      hasObservedBusySinceLagRef.current = false
      setCommittedFields(extractOperativePresentationFields(round))
      return
    }

    if (!revealOverlayIdleRef.current) {
      hasObservedBusySinceLagRef.current = true
      return
    }

    if (hasObservedBusySinceLagRef.current) {
      hasObservedBusySinceLagRef.current = false
      setCommittedFields(extractOperativePresentationFields(round))
    }
  }, [round, isOperative, isRevealOverlayIdle, revealOverlayIdleRef])

  const hasOperativeRevealPresentationLag = useMemo(() => {
    if (!round || !isOperative)
      return false
    return hasUncommittedOperativeRevealLag(round, committedFields)
  }, [round, isOperative, committedFields])

  const roundForDerivedUi = useMemo((): RoundState | null => {
    if (!round)
      return null
    if (!isOperative)
      return round
    return mergePresentationFieldsIntoRound(round, committedFields)
  }, [round, isOperative, committedFields])

  const timelineItemsForSidebar = useMemo(() => {
    if (!round || !isOperative)
      return timelineItems
    const suppressTimelineSpoilers = hasOperativeRevealPresentationLag
    return filterTimelineItemsForOperativeRevealLag(timelineItems, round, committedFields, {
      hideGameFinished: gameStatus === 'FINISHED' && suppressTimelineSpoilers,
      hideTurnPassed: suppressTimelineSpoilers,
    })
  }, [gameStatus, isOperative, hasOperativeRevealPresentationLag, round, timelineItems, committedFields])

  return { roundForDerivedUi, timelineItemsForSidebar, hasOperativeRevealPresentationLag }
}
