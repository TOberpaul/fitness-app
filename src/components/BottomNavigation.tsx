import { NavLink, useLocation } from 'react-router-dom'
import { ChartLine, Scale, Settings, RulerDimensionLine } from 'lucide-react'
import './BottomNavigation.css'

function NavItem({ to, end, icon, label }: { to: string; end?: boolean; icon: React.ReactNode; label: string }) {
  const location = useLocation()
  const isActive = end ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <NavLink
      to={to}
      end={end}
      className={`adaptive bottom-nav-link${isActive ? ' active' : ''}`}
      data-interactive
      {...(isActive ? { 'data-material': 'inverted', 'data-container-contrast': 'max' } : { 'data-material': 'transparent' })}
    >
      {icon}
      <span className="bottom-nav-label sr-only">{label}</span>
    </NavLink>
  )
}

function BottomNavigation() {
  return (
    <nav className="bottom-nav adaptive" >
      <NavItem to="/" end label="Dashboard" icon={<ChartLine className="bottom-nav-icon" />} />
      <NavItem to="/daily" label="Täglich" icon={<Scale className="bottom-nav-icon" />} />
      <NavItem to="/weekly" label="Wöchentlich" icon={<RulerDimensionLine className="bottom-nav-icon" />} />
      <NavItem to="/settings" label="Mehr" icon={<Settings className="bottom-nav-icon" />} />
    </nav>
  )
}

export default BottomNavigation
