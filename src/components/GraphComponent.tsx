import { useEffect, useRef, useCallback } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import './GraphComponent.css'
import type { DataPoint, TimeRange } from '../types'

export interface GraphComponentProps {
  data: DataPoint[]
  timeRange: TimeRange
  onCrosshair?: (point: DataPoint | null) => void
  trendDirection: 'lower-is-better' | 'higher-is-better'
}

const GREEN = '#00C853'
const RED = '#FF1744'

function getLineColor(
  data: DataPoint[],
  trendDirection: 'lower-is-better' | 'higher-is-better'
): string {
  if (data.length < 2) return GREEN
  const first = data[0].value
  const last = data[data.length - 1].value

  if (trendDirection === 'lower-is-better') {
    return last < first ? GREEN : last > first ? RED : GREEN
  }
  // higher-is-better
  return last > first ? GREEN : last < first ? RED : GREEN
}

function GraphComponent({
  data,
  timeRange: _timeRange,
  onCrosshair,
  trendDirection,
}: GraphComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<uPlot | null>(null)
  const onCrosshairRef = useRef(onCrosshair)

  // Keep callback ref in sync without triggering re-renders
  useEffect(() => {
    onCrosshairRef.current = onCrosshair
  }, [onCrosshair])

  const sortedData = [...data].sort(
    (a, b) => Date.parse(a.date) - Date.parse(b.date)
  )

  const handleCursorMove = useCallback(
    (u: uPlot) => {
      const idx = u.cursor.idx
      if (idx == null || idx < 0 || idx >= sortedData.length) {
        onCrosshairRef.current?.(null)
      } else {
        onCrosshairRef.current?.(sortedData[idx])
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortedData.length, sortedData[0]?.date, sortedData[sortedData.length - 1]?.date]
  )

  useEffect(() => {
    if (!containerRef.current || sortedData.length < 2) return

    const container = containerRef.current
    const width = container.clientWidth || 300

    const timestamps = sortedData.map((d) => Date.parse(d.date) / 1000)
    const values = sortedData.map((d) => d.value)
    const lineColor = getLineColor(sortedData, trendDirection)

    const opts: uPlot.Options = {
      width,
      height: 200,
      cursor: {
        y: false,
        drag: { x: false, y: false },
      },
      select: { show: false, left: 0, top: 0, width: 0, height: 0 },
      legend: { show: false },
      axes: [
        {
          show: false,
          grid: { show: false },
          ticks: { show: false },
        },
        {
          show: false,
          grid: { show: false },
          ticks: { show: false },
        },
      ],
      series: [
        {},
        {
          stroke: lineColor,
          width: 2,
          fill: undefined,
        },
      ],
      hooks: {
        setCursor: [handleCursorMove],
      },
    }

    const chart = new uPlot(opts, [timestamps, values], container)
    chartRef.current = chart

    const handleResize = () => {
      if (containerRef.current) {
        chart.setSize({
          width: containerRef.current.clientWidth,
          height: 200,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.destroy()
      chartRef.current = null
    }
  }, [sortedData, trendDirection, handleCursorMove])

  if (data.length < 2) {
    return (
      <div className="graph-container">
        <div className="graph-fallback">
          Nicht genügend Daten für den Graphen
        </div>
      </div>
    )
  }

  return (
    <div className="graph-container">
      <div className="graph-canvas" ref={containerRef} />
    </div>
  )
}

export default GraphComponent
