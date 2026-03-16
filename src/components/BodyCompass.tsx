import { TrendingDown, MoveRight, TrendingUp } from 'lucide-react'
import { motion } from 'motion/react'
import type { CircumferenceZone, TrendDirection } from '../types'
import { staggerContainer, fadeIn } from '../animations/presets'
import { useReducedMotion, getVariants } from '../animations/hooks'
import './BodyCompass.css'
import './core/Card.css'

interface BodyCompassProps {
  trends: Record<CircumferenceZone, TrendDirection | null>
}

const ZONE_LABELS: Record<CircumferenceZone, string> = {
  chest: 'Brust',
  waist: 'Taille',
  belly: 'Bauch',
  hip: 'Hüfte',
  upperArm: 'Oberarm',
  thigh: 'Oberschenkel',
}

const ZONE_ORDER: CircumferenceZone[] = ['chest', 'waist', 'belly', 'hip', 'upperArm', 'thigh']

const TREND_DISPLAY: Record<TrendDirection, { icon: typeof TrendingDown; label: string }> = {
  improving: { icon: TrendingDown, label: 'Abnehmend' },
  stable: { icon: MoveRight, label: 'Stabil' },
  declining: { icon: TrendingUp, label: 'Zunehmend' },
}

function BodyCompass({ trends }: BodyCompassProps) {
  const reducedMotion = useReducedMotion()
  const fadeInVariants = getVariants(fadeIn, reducedMotion)

  return (
    <div className="body-compass core-card adaptive">
      <span className="body-compass-title">Körperkompass</span>
      <motion.div
        className="body-compass-zones"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {ZONE_ORDER.map((zone) => {
          const trend = trends[zone]
          return (
            <motion.div className="body-compass-zone" key={zone} variants={fadeInVariants}>
              <span className="body-compass-zone-label">{ZONE_LABELS[zone]}</span>
              {trend !== null ? (
                <span className="body-compass-trend" data-trend={trend} data-content-contrast="min">
                  {(() => { const Icon = TREND_DISPLAY[trend].icon; return <Icon size={16} /> })()}
                  {' '}{TREND_DISPLAY[trend].label}
                </span>
              ) : (
                <span className="body-compass-no-data">Noch nicht genug Daten</span>
              )}
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}

export default BodyCompass
