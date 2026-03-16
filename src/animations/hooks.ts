import { useState, useEffect } from 'react'
import { useReducedMotion as useMotionReducedMotion } from 'motion/react'
import { animate } from 'motion'
import type { AnimationVariants } from './presets'
import { REDUCED_MOTION_VARIANTS, DURATIONS } from './presets'

/**
 * Gibt true zurück, wenn prefers-reduced-motion aktiv ist.
 * Nutzt den eingebauten motion.dev-Hook.
 */
export function useReducedMotion(): boolean {
  return useMotionReducedMotion() ?? false
}

/**
 * Gibt Varianten zurück, die bei reduced-motion sofortige Übergänge verwenden.
 */
export function getVariants(
  variants: AnimationVariants,
  reducedMotion: boolean
): AnimationVariants {
  if (reducedMotion) return REDUCED_MOTION_VARIANTS
  return variants
}

/**
 * Hook für animierte Zahlenwerte.
 * Nutzt motion.dev animate() um von previousValue zu currentValue zu zählen.
 */
export function useAnimatedNumber(
  value: number,
  decimals: number = 1,
  duration: number = DURATIONS.emphasis
): string {
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    const controls = animate(displayValue, value, {
      duration,
      onUpdate: (latest) => setDisplayValue(latest),
    })

    return () => controls.stop()
  }, [value, duration]) // eslint-disable-line react-hooks/exhaustive-deps

  return displayValue.toFixed(decimals)
}
