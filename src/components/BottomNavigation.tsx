import { ChartLine, Scale, RulerDimensionLine, Target, Settings, Apple } from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePanelContext } from '../App'
import { EASINGS } from '../animations/presets'
import { useReducedMotion } from '../animations/hooks'
import './BottomNavigation.css'

type TabDef = { label: string; icon: typeof ChartLine } & (
  | { type: 'snap'; index: number }
  | { type: 'route'; path: string }
)

const TABS: TabDef[] = [
  { type: 'snap', index: 0, label: 'Dashboard', icon: ChartLine },
  { type: 'snap', index: 1, label: 'Täglich', icon: Scale },
  { type: 'snap', index: 2, label: 'Wöchentlich', icon: RulerDimensionLine },
  { type: 'snap', index: 3, label: 'Ziele', icon: Target },
  { type: 'snap', index: 4, label: 'Mehr', icon: Settings },
  { type: 'route', path: '/nutrition', label: 'Ernährung', icon: Apple },
]

function BottomNavigation() {
  const { activeIndex, scrollTo } = usePanelContext()
  const navigate = useNavigate()
  const location = useLocation()
  const reducedMotion = useReducedMotion()

  const indicatorTransition = reducedMotion
    ? { duration: 0 }
    : EASINGS.spring

  return (
    <nav className="bottom-nav adaptive">
      {TABS.map((tab, i) => {
        const Icon = tab.icon
        const isActive = tab.type === 'snap'
          ? activeIndex === tab.index && !location.pathname.startsWith('/nutrition')
          : location.pathname.startsWith(tab.path)
        const handleClick = tab.type === 'snap'
          ? () => scrollTo(tab.index)
          : () => navigate(tab.path)
        return (
          <button
            key={i}
            className={`adaptive bottom-nav-link${isActive ? ' active' : ''}`}
            data-interactive
            {...(isActive
              ? { 'data-material': 'inverted', 'data-container-contrast': 'max' }
              : { 'data-material': 'transparent' })}
            onClick={handleClick}
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
