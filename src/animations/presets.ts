// Timing-Konstanten
export const DURATIONS = {
  micro: 0.2,       // Tap-Feedback, Hover
  standard: 0.3,    // Fade-In, Slide-Up
  emphasis: 0.4,    // Zahlen-Animation
  entrance: 0.6,    // Fortschrittsbalken, Seitenübergänge
} as const

export const EASINGS = {
  easeOut: [0.0, 0.0, 0.2, 1.0],
  easeInOut: [0.4, 0.0, 0.2, 1.0],
  spring: { type: 'spring', stiffness: 400, damping: 30 },
  bounce: { type: 'spring', stiffness: 300, damping: 20 },
} as const

export const STAGGER_DELAY = 0.06 // 60ms zwischen Kinder-Elementen

// Varianten-Definitionen
export type AnimationVariants = {
  initial: Record<string, unknown>
  animate: Record<string, unknown>
  exit?: Record<string, unknown>
}

export const fadeIn: AnimationVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DURATIONS.standard } },
  exit: { opacity: 0, transition: { duration: DURATIONS.micro } },
}

export const slideUp: AnimationVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATIONS.standard, ease: EASINGS.easeOut } },
  exit: { opacity: 0, y: 20, transition: { duration: DURATIONS.micro } },
}

export const scaleIn: AnimationVariants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1, transition: { duration: DURATIONS.standard, ease: EASINGS.easeOut } },
  exit: { opacity: 0, scale: 0.92, transition: { duration: DURATIONS.micro } },
}

export const dialogVariants: AnimationVariants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATIONS.standard, ease: EASINGS.easeOut } },
  exit: { opacity: 0, y: 40, transition: { duration: DURATIONS.micro, ease: EASINGS.easeInOut } },
}


export const backdropVariants: AnimationVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DURATIONS.micro } },
  exit: { opacity: 0, transition: { duration: DURATIONS.micro } },
}

export const staggerContainer = {
  animate: { transition: { staggerChildren: STAGGER_DELAY } },
}

export const tapFeedback = {
  whileTap: { scale: 0.97 },
  transition: { duration: DURATIONS.micro },
}

// Reduced-Motion-Varianten: sofortige Zustandsänderung
export const REDUCED_MOTION_VARIANTS: AnimationVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
}
