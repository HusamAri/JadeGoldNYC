/**
 * Site-wide calm motion tokens — Jade Gold panel.
 *
 * Research base (2025–26): spring physics over linear easing (ζ≈1 for UI),
 * transform/opacity only, durations under ~400ms for feedback, scroll reveals
 * once, always honor prefers-reduced-motion. Goal: invisible physicality —
 * sections react to scroll/click/each other without looking “digital”.
 *
 * Ease array matches CSS `--ease-premium` (cubic-bezier(0.22, 1, 0.36, 1)).
 */

export const easePremium = [0.22, 1, 0.36, 1] as const;

/** Critically damped-ish UI springs — quiet settle, almost no bounce. */
export const springs = {
  /** Buttons / chips — snappy press. */
  snappy: { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.85 },
  /** Cards / sections — calm rise. */
  calm: { type: "spring" as const, stiffness: 180, damping: 26, mass: 1 },
  /** Page / large panels — deliberate mass. */
  gentle: { type: "spring" as const, stiffness: 120, damping: 22, mass: 1.1 },
};

export const durations = {
  press: 0.18,
  hover: 0.28,
  reveal: 0.55,
  page: 0.38,
  chain: 0.045,
} as const;

/** Shared enter — opacity + tiny rise (never animate filter/backdrop-filter). */
export const revealVariants = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easePremium },
  },
};

export const chainContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: durations.chain,
      delayChildren: 0.03,
    },
  },
};

export const chainItem = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.36, ease: easePremium },
  },
};
