import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './styles/foundation.css'
import './styles/foundation-size.css'
import './index.css'
import App from './App.tsx'

// Apply saved theme before render to avoid flash
const savedTheme = localStorage.getItem('theme_mode')
if (savedTheme === 'light' || savedTheme === 'dark') {
  document.documentElement.setAttribute('data-mode', savedTheme)
}

// Register service worker for offline support and PWA installation
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
