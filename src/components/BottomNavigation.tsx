import { ChartLine, Scale, RulerDimensionLine, Target, Settings } from 'lucide-react'
import { usePanelContext } from '../App'
import './BottomNavigation.css'

const TABS = [
  { index: 0, label: 'Dashboard', icon: ChartLine },
  { index: 1, label: 'Täglich', icon: Scale },
  { index: 2, label: 'Wöchentlich', icon: RulerDimensionLine },
  { index: 3, label: 'Ziele', icon: Target },
  { index: 4, label: 'Mehr', icon: Settings },
]

function BottomNavigation() {
  const { activeIndex, scrollTo } = usePanelContext()

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
            <Icon className="bottom-nav-icon" />
            <span className="bottom-nav-label sr-only">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default BottomNavigation
