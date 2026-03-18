import { useState, useCallback, useRef } from 'react'
import './SleepyMascot.css'

type MascotState = 'sleeping' | 'awake' | 'falling-asleep' | 'purring'

function SleepyMascot() {
  const [state, setState] = useState<MascotState>('sleeping')
  const [showHint, setShowHint] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartRef = useRef<{ x: number; y: number; moved: boolean } | null>(null)

  const wake = useCallback(() => {
    setState('awake')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setState('falling-asleep')
      setTimeout(() => setState('sleeping'), 800)
    }, 3000)
  }, [])

  const purr = useCallback(() => {
    setState('purring')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setState('sleeping')
    }, 3000)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    touchStartRef.current = { x: t.clientX, y: t.clientY, moved: false }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const t = e.touches[0]
    const dx = Math.abs(t.clientX - touchStartRef.current.x)
    if (dx > 10) touchStartRef.current.moved = true
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (state !== 'sleeping') {
      touchStartRef.current = null
      return
    }
    setShowHint(false)
    if (touchStartRef.current?.moved) {
      purr()
    } else {
      wake()
    }
    touchStartRef.current = null
  }, [state, wake, purr])

  // Fallback for mouse (desktop)
  const handleClick = useCallback(() => {
    if (state !== 'sleeping') return
    // Only fire if no touch happened (touch devices fire both)
    if (touchStartRef.current !== null) return
    setShowHint(false)
    wake()
  }, [state, wake])

  return (
    <>
      <div
        className={`mascot mascot--${state}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        role="img"
        aria-label="Schlafendes Maskottchen"
      >
        <img
          src={`${import.meta.env.BASE_URL}Sleepy.png`}
          alt=""
          className="mascot-img"
        />
        <div className="mascot-eyes">
          <div className="mascot-eye mascot-eye--left">
            <div className="mascot-eye-closed" />
            <div className="mascot-eye-open">
              <div className="mascot-pupil" />
            </div>
          </div>
          <div className="mascot-eye mascot-eye--right">
            <div className="mascot-eye-closed" />
            <div className="mascot-eye-open">
              <div className="mascot-pupil" />
            </div>
          </div>
        </div>
        <div className="mascot-zzz">
          <span className="mascot-z mascot-z--1">z</span>
          <span className="mascot-z mascot-z--2">z</span>
          <span className="mascot-z mascot-z--3">z</span>
        </div>
        <div className="mascot-hearts">
          <span className="mascot-heart mascot-heart--1">♥</span>
          <span className="mascot-heart mascot-heart--2">♥</span>
          <span className="mascot-heart mascot-heart--3">♥</span>
        </div>
        <div className="mascot-grr">Grr!</div>
      </div>
      {showHint && <span className="mascot-hint" data-emphasis="weak">Antippen 👆</span>}
    </>
  )
}

export default SleepyMascot
