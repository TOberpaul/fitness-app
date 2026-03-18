import { useState, useCallback, useRef } from 'react'
import './SleepyMascot.css'

function SleepyMascot() {
  const [awake, setAwake] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTap = useCallback(() => {
    if (awake) return
    setAwake(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setAwake(false), 3000)
  }, [awake])

  return (
    <div
      className={`mascot${awake ? ' mascot--awake' : ''}`}
      onClick={handleTap}
      role="img"
      aria-label="Schlafendes Maskottchen"
    >
      <img
        src={`${import.meta.env.BASE_URL}Sleepy.png`}
        alt=""
        className="mascot-img"
      />

      {/* CSS eyes overlay */}
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

      {/* Zzz animation */}
      <div className="mascot-zzz">
        <span className="mascot-z mascot-z--1">z</span>
        <span className="mascot-z mascot-z--2">z</span>
        <span className="mascot-z mascot-z--3">z</span>
      </div>

      {/* Grr on wake */}
      <div className="mascot-grr">Grr!</div>
    </div>
  )
}

export default SleepyMascot
