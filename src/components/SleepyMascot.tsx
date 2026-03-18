import { useState, useCallback, useRef } from 'react'
import './SleepyMascot.css'

type MascotState = 'sleeping' | 'awake' | 'falling-asleep' | 'purring' | 'drifting-off'

function SleepyMascot() {
  const [state, setState] = useState<MascotState>('sleeping')
  const [hintPhase, setHintPhase] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleReturn = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setState('falling-asleep')
      setTimeout(() => setState('sleeping'), 800)
    }, 3000)
  }, [])

  const handleTap = useCallback(() => {
    if (state === 'sleeping') {
      if (hintPhase === 0) setHintPhase(1)
      setState('awake')
      scheduleReturn()
    } else if (state === 'awake') {
      setHintPhase(2)
      setState('purring')
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setState('drifting-off')
        setTimeout(() => setState('sleeping'), 1500)
      }, 2000)
    }
  }, [state, hintPhase, scheduleReturn])

  return (
    <>
      <div
        className={`mascot mascot--${state}`}
        onClick={handleTap}
        role="img"
        aria-label="Schlafendes Maskottchen"
        data-material="filled"
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
        <div className="mascot-purr-text">Prrr~</div>
      </div>
      <span className={`mascot-hint${hintPhase >= 2 ? ' mascot-hint--hidden' : ''}`} data-emphasis="weak">
        {hintPhase === 0 ? 'Antippen' : 'Nochmal wenn er wach ist'}
      </span>
    </>
  )
}

export default SleepyMascot
