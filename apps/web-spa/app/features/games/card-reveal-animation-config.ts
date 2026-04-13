/**
 * Tunables for the operative card reveal overlay (grow → hold → shrink).
 * Pass partial overrides via {@link mergeCardRevealAnimationConfig}.
 */
export interface CardRevealAnimationConfig {
  /** Time the card stays at the center after expanding (ms). */
  holdAtCenterMs: number
  /** Extra scale cap relative to source size before grid cap applies. */
  maxScale: number
  /** Max width/height as a fraction of min(grid width, grid height) of the word grid. */
  maxSizeFractionOfGrid: number
  /** Peak scale during the “bump” at max size (1 = none); runs with the color reveal. */
  bumpScale: number
  bumpDurationMs: number
  /**
   * Bézier from scale 1 → {@link bumpScale} (y &gt; 1 on control points yields overshoot past the peak).
   */
  bumpExpandEasing: string
  /**
   * Bézier from {@link bumpScale} → scale 1 (y &lt; 0 on control points yields slight undershoot before rest).
   */
  bumpSettleEasing: string
  /** Move from grid cell to center (ms). */
  expandDurationMs: number
  /** Move from center back to grid cell (ms). */
  shrinkDurationMs: number
  /** Color reveal from bottom to top (ms); runs after expand, while the card is at max size. */
  rippleDurationMs: number
  expandEasing: string
  shrinkEasing: string
  rippleEasing: string
  /** Stacking order for the fixed overlay. */
  overlayZIndex: number
  /** If true, skip motion and call onComplete almost immediately when reduced motion is requested. */
  respectReducedMotion: boolean
  /** Delay before onComplete when reduced motion (ms). */
  reducedMotionCompleteDelayMs: number
}

export const DEFAULT_CARD_REVEAL_ANIMATION_CONFIG: CardRevealAnimationConfig = {
  holdAtCenterMs: 500,
  maxScale: 2.5,
  maxSizeFractionOfGrid: 0.7,
  bumpScale: 1.17,
  bumpDurationMs: 420,
  bumpExpandEasing: 'cubic-bezier(0.22, 1.45, 0.32, 1.02)',
  bumpSettleEasing: 'cubic-bezier(0.68, -0.48, 0.28, 1.42)',
  expandDurationMs: 1000,
  shrinkDurationMs: 300,
  rippleDurationMs: 400,
  expandEasing: 'cubic-bezier(0.66, 0, 0.155, 1)',
  shrinkEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  rippleEasing: 'cubic-bezier(0.45, 0, 0.2, 1)',
  overlayZIndex: 200,
  respectReducedMotion: true,
  reducedMotionCompleteDelayMs: 40,
}

export function mergeCardRevealAnimationConfig(
  partial?: Partial<CardRevealAnimationConfig>,
): CardRevealAnimationConfig {
  return { ...DEFAULT_CARD_REVEAL_ANIMATION_CONFIG, ...partial }
}
