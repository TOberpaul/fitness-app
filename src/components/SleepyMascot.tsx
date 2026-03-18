import { useState, useCallback, useRef } from 'react'
import './SleepyMascot.css'

type MascotState = 'sleeping' | 'awake' | 'falling-asleep' | 'purring'

function SleepyMascot() {
  const [state, setState] = useState<MascotState>('sleeping')
  const [showHint, setShowHint] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleReturn = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setState('falling-asleep')
      setTimeout(() => setState('sleeping'), 800)
    }, 3000)
  }, [])

  const handleTap = useCallback(() => {
    setShowHint(false)
    if (state === 'sleeping') {
      setState('awake')
      scheduleReturn()
    } else if (state === 'awake') {
      setState('purring')
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setState('sleeping'), 3000)
    }
  }, [state, scheduleReturn])

  return (
    <>
      <div
        className={`mascot mascot--${state}`}
        onClick={handleTap}
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
