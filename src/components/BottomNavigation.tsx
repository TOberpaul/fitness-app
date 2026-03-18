import { ChartLine, Scale, RulerDimensionLine, Target, Settings, Apple } from 'lucide-react'
import { motion } from 'motion/react'
import { usePanelContext } from '../App'
import { EASINGS } from '../animations/presets'
import { useReducedMotion } from '../animations/hooks'
import './BottomNavigation.css'

const TABS = [
  { index: 0, label: 'Dashboard', icon: ChartLine },
  { index: 1, label: 'Täglich', icon: Scale },
  { index: 2, label: 'Wöchentlich', icon: RulerDimensionLine },
  { index: 3, label: 'Ziele', icon: Target },
  { index: 4, label: 'Ernährung', icon: Apple },
  { index: 5, label: 'Mehr', icon: Settings },
]

function BottomNavigation() {
  const { activeIndex, scrollTo } = usePanelContext()
  const reducedMotion = useReducedMotion()

  const indicatorTransition = reducedMotion
    ? { duration: 0 }
    : EASINGS.spring

  return (
    <nav className="bottom-nav adaptive">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = activeIndex === tab.index
        return (
          <button
            key={tab.index}
            className={`adaptive bottom-nav-link${isActive ? ' active' : ''}`}
            data-interactive
            {...(isActive
              ? { 'data-material': 'inverted', 'data-container-contrast': 'max' }
              : { 'data-material': 'transparent' })}
            onClick={() => scrollTo(tab.index)}
          >
            <motion.div
              className="bottom-nav-active-indicator"
              initial={false}
              animate={{ opacity: isActive ? 0.12 : 0 }}
              transition={indicatorTransition}
            />
            <Icon className="bottom-nav-icon" />
            <span className="bottom-nav-label sr-only">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default BottomNavigation
