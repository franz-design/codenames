import type { CardRevealAnimationConfig } from '../card-reveal-animation-config'
import type { CardType } from '../types'
import { cn } from '@codenames/ui/lib/utils'
import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

/** Grid card face uses fixed text-sm; overlay card grows — size typography with the box via cqmin. */
const OVERLAY_CARD_OUTER_CLASS
  = 'pointer-events-none overflow-hidden rounded-lg shadow-xl @container [container-type:size]'

const OVERLAY_CARD_FACE_CLASS
  = 'flex h-full w-full flex-col items-center justify-center rounded-lg border border-primary-border bg-primary p-[clamp(0.35rem,2.8cqmin,1rem)] text-center font-bold text-primary-foreground'

const OVERLAY_CARD_WORD_TEXT_CLASS
  = 'line-clamp-2 max-w-full break-words px-[clamp(0.2rem,2cqmin,0.65rem)] text-[clamp(0.8rem,13cqmin,2.15rem)] leading-tight'

const CARD_COLOR_STYLE: Record<CardType, { background: string, borderColor: string }> = {
  red: { background: 'var(--red)', borderColor: 'var(--red-dark)' },
  blue: { background: 'var(--blue)', borderColor: 'var(--blue-dark)' },
  neutral: { background: 'var(--neutral)', borderColor: 'var(--neutral-dark)' },
  black: { background: 'var(--black)', borderColor: 'var(--black-dark)' },
}

export interface CardRevealOverlayProps {
  word: string
  cardType: CardType
  /** Snapshot of the grid cell before the overlay mounts. */
  initialRect: { left: number, top: number, width: number, height: number }
  /** Word grid bounds (viewport); center and max size are relative to this box. */
  gridRect: { left: number, top: number, width: number, height: number }
  config: CardRevealAnimationConfig
  onComplete: () => void
}

function computeTargetRect(
  source: { width: number, height: number },
  gridBounds: { left: number, top: number, width: number, height: number },
  cfg: CardRevealAnimationConfig,
): { left: number, top: number, width: number, height: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const hasValidGrid = gridBounds.width > 0 && gridBounds.height > 0
  const gridMin = hasValidGrid ? Math.min(gridBounds.width, gridBounds.height) : Math.min(vw, vh)
  const maxW = gridMin * cfg.maxSizeFractionOfGrid
  const maxH = gridMin * cfg.maxSizeFractionOfGrid
  const aspect = source.width / source.height

  let w1 = Math.min(source.width * cfg.maxScale, maxW)
  let h1 = w1 / aspect
  if (h1 > maxH) {
    h1 = maxH
    w1 = h1 * aspect
  }

  const centerX = hasValidGrid ? gridBounds.left + gridBounds.width / 2 : vw / 2
  const centerY = hasValidGrid ? gridBounds.top + gridBounds.height / 2 : vh / 2

  return {
    left: centerX - w1 / 2,
    top: centerY - h1 / 2,
    width: w1,
    height: h1,
  }
}

export function CardRevealOverlay({
  word,
  cardType,
  initialRect,
  gridRect,
  config,
  onComplete,
}: CardRevealOverlayProps) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const colorLayerRef = useRef<HTMLDivElement>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const animationsRef = useRef<Animation[]>([])

  useLayoutEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    const colorLayer = colorLayerRef.current
    if (!outer || !inner || !colorLayer)
      return

    const r0 = initialRect
    const cfg = config

    const cancelAll = (): void => {
      for (const a of animationsRef.current)
        a.cancel()
      animationsRef.current = []
    }

    const prefersReduced
      = cfg.respectReducedMotion
        && typeof window !== 'undefined'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      const t = window.setTimeout(() => {
        onCompleteRef.current()
      }, cfg.reducedMotionCompleteDelayMs)
      return () => {
        window.clearTimeout(t)
      }
    }

    const r1 = computeTargetRect(r0, gridRect, cfg)

    outer.style.position = 'fixed'
    outer.style.left = '0'
    outer.style.top = '0'
    outer.style.width = `${r0.width}px`
    outer.style.height = `${r0.height}px`
    outer.style.transform = `translate(${r0.left}px, ${r0.top}px)`
    outer.style.zIndex = String(cfg.overlayZIndex)
    outer.style.willChange = 'transform, width, height'

    const expandAnim = outer.animate(
      [
        {
          transform: `translate(${r0.left}px, ${r0.top}px)`,
          width: `${r0.width}px`,
          height: `${r0.height}px`,
        },
        {
          transform: `translate(${r1.left}px, ${r1.top}px)`,
          width: `${r1.width}px`,
          height: `${r1.height}px`,
        },
      ],
      {
        duration: cfg.expandDurationMs,
        easing: cfg.expandEasing,
        fill: 'forwards',
      },
    )

    animationsRef.current = [expandAnim]

    let cancelled = false
    let holdTimeoutId: ReturnType<typeof window.setTimeout> | undefined

    const run = async (): Promise<void> => {
      try {
        await expandAnim.finished
        if (cancelled)
          return

        const bumpAnim = inner.animate(
          [
            { transform: 'scale(1)' },
            {
              transform: `scale(${cfg.bumpScale})`,
              offset: 0.4,
              easing: cfg.bumpExpandEasing,
            },
            {
              transform: 'scale(1)',
              offset: 1,
              easing: cfg.bumpSettleEasing,
            },
          ],
          {
            duration: cfg.bumpDurationMs,
            fill: 'forwards',
          },
        )

        const rippleAnim = colorLayer.animate(
          [
            { clipPath: 'inset(100% 0 0 0)' },
            { clipPath: 'inset(0 0 0 0)' },
          ],
          {
            duration: cfg.rippleDurationMs,
            easing: cfg.rippleEasing,
            fill: 'forwards',
          },
        )

        animationsRef.current.push(bumpAnim, rippleAnim)
        await Promise.all([bumpAnim.finished, rippleAnim.finished])
        if (cancelled)
          return

        await new Promise<void>((resolve) => {
          holdTimeoutId = window.setTimeout(() => {
            holdTimeoutId = undefined
            resolve()
          }, cfg.holdAtCenterMs)
        })
        if (cancelled)
          return

        const shrinkAnim = outer.animate(
          [
            {
              transform: `translate(${r1.left}px, ${r1.top}px)`,
              width: `${r1.width}px`,
              height: `${r1.height}px`,
            },
            {
              transform: `translate(${r0.left}px, ${r0.top}px)`,
              width: `${r0.width}px`,
              height: `${r0.height}px`,
            },
          ],
          {
            duration: cfg.shrinkDurationMs,
            easing: cfg.shrinkEasing,
            fill: 'forwards',
          },
        )
        animationsRef.current.push(shrinkAnim)
        await shrinkAnim.finished
        if (!cancelled)
          onCompleteRef.current()
      }
      catch {
        if (!cancelled)
          onCompleteRef.current()
      }
    }

    void run()

    return () => {
      cancelled = true
      if (holdTimeoutId !== undefined)
        window.clearTimeout(holdTimeoutId)
      cancelAll()
    }
  // One-shot per portal mount; props captured on first layout commit.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [])

  const teamStyle = CARD_COLOR_STYLE[cardType]

  const node = (
    <div
      ref={outerRef}
      className={OVERLAY_CARD_OUTER_CLASS}
      aria-hidden
    >
      <div ref={innerRef} className="relative h-full w-full origin-center">
        <div className={cn(OVERLAY_CARD_FACE_CLASS, 'absolute inset-0 z-0')}>
          <span className={OVERLAY_CARD_WORD_TEXT_CLASS}>{word}</span>
        </div>
        <div
          ref={colorLayerRef}
          className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit]"
          style={{
            background: teamStyle.background,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: teamStyle.borderColor,
            clipPath: 'inset(100% 0 0 0)',
          }}
        >
          <span
            className={cn(
              OVERLAY_CARD_WORD_TEXT_CLASS,
              'font-bold',
              cardType === 'neutral' ? 'text-neutral-foreground' : 'text-white',
            )}
          >
            {word}
          </span>
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
