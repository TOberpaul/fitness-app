import { NavLink, useLocation } from 'react-router-dom'
import { Activity, Plus, Settings, PersonStanding } from 'lucide-react'
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
      {...(isActive ? { 'data-material': 'inverted', 'data-container-contrast': 'max' } : {})}
    >
      {icon}
      <span className="bottom-nav-label">{label}</span>
    </NavLink>
  )
}

function BottomNavigation() {
  return (
    <nav className="bottom-nav adaptive" data-size="md" data-material="filled">
      <NavItem to="/" end label="Dashboard" icon={<Activity className="bottom-nav-icon" />} />
      <NavItem to="/daily" label="Täglich" icon={<Plus className="bottom-nav-icon" />} />
      <NavItem to="/weekly" label="Wöchentlich" icon={<PersonStanding className="bottom-nav-icon" />} />
      <NavItem to="/settings" label="Mehr" icon={<Settings className="bottom-nav-icon" />} />
    </nav>
  )
}

export default BottomNavigation
