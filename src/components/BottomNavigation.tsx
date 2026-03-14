import { NavLink } from 'react-router-dom'
import './BottomNavigation.css'

function BottomNavigation() {
  return (
    <nav className="bottom-nav adaptive">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `bottom-nav-link${isActive ? ' active' : ''}`
        }
        data-interactive
      >
        <svg
          className="bottom-nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span className="bottom-nav-label">Dashboard</span>
      </NavLink>

      <NavLink
        to="/daily"
        className={({ isActive }) =>
          `bottom-nav-link${isActive ? ' active' : ''}`
        }
        data-interactive
      >
        <svg
          className="bottom-nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span className="bottom-nav-label">Täglich</span>
      </NavLink>

      <NavLink
        to="/weekly"
        className={({ isActive }) =>
          `bottom-nav-link${isActive ? ' active' : ''}`
        }
        data-interactive
      >
        <svg
          className="bottom-nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 12h4l2-8 4 16 2-8h4" />
          <line x1="2" y1="20" x2="22" y2="20" />
        </svg>
        <span className="bottom-nav-label">Wöchentlich</span>
      </NavLink>
    </nav>
  )
}

export default BottomNavigation
