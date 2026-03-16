import { motion } from 'motion/react'
import { slideUp, STAGGER_DELAY } from '../animations/presets'
import { useReducedMotion, getVariants } from '../animations/hooks'
import './EmptyState.css'

interface EmptyStateProps {
  icon?: React.ReactNode
  message: string
  ctaLabel: string
  onCtaClick: () => void
}

const emptyStateContainer = {
  animate: { transition: { staggerChildren: STAGGER_DELAY, delayChildren: 0.2 } },
}

function EmptyState({ icon, message, ctaLabel, onCtaClick }: EmptyStateProps) {
  const reducedMotion = useReducedMotion()
  const childVariants = getVariants(slideUp, reducedMotion)

  return (
    <motion.div
      className="empty-state adaptive"
      variants={emptyStateContainer}
      initial="initial"
      animate="animate"
    >
      {icon && (
        <motion.div className="empty-state-icon" variants={childVariants}>
          {icon}
        </motion.div>
      )}
      <motion.p className="empty-state-message" variants={childVariants}>
        {message}
      </motion.p>
      <motion.button
        className="empty-state-cta adaptive"
        data-interactive
        onClick={onCtaClick}
        variants={childVariants}
      >
        {ctaLabel}
      </motion.button>
    </motion.div>
  )
}

export default EmptyState
