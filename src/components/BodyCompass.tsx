import type { CircumferenceZone, TrendDirection } from '../types'
import './BodyCompass.css'

interface BodyCompassProps {
  trends: Record<CircumferenceZone, TrendDirection | null>
}

const ZONE_LABELS: Record<CircumferenceZone, string> = {
  chest: 'Brust',
  waist: 'Taille',
  belly: 'Bauch',
  hip: 'Hüfte',
  upperArm: 'Oberarm',
  thigh: 'Oberschenkel',
}

const ZONE_ORDER: CircumferenceZone[] = ['chest', 'waist', 'belly', 'hip', 'upperArm', 'thigh']

const TREND_DISPLAY: Record<TrendDirection, { symbol: string; label: string }> = {
  improving: { symbol: '↓', label: 'Abnehmend' },
  stable: { symbol: '→', label: 'Stabil' },
  declining: { symbol: '↑', label: 'Zunehmend' },
}

function BodyCompass({ trends }: BodyCompassProps) {
  return (
    <div className="body-compass adaptive">
      <span className="body-compass-title">Körperkompass</span>
      <div className="body-compass-zones">
        {ZONE_ORDER.map((zone) => {
          const trend = trends[zone]
          return (
            <div className="body-compass-zone" key={zone}>
              <span className="body-compass-zone-label">{ZONE_LABELS[zone]}</span>
              {trend !== null ? (
                <span className="body-compass-trend" data-trend={trend}>
                  {TREND_DISPLAY[trend].symbol} {TREND_DISPLAY[trend].label}
                </span>
              ) : (
                <span className="body-compass-no-data">Noch nicht genug Daten</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BodyCompass
