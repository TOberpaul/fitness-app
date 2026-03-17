import { useEffect, useRef, useMemo } from 'react'
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

function resolveColor(el: Element, varName: string): string {
  const raw = getComputedStyle(el).getPropertyValue(varName).trim()
  // light-dark() may not be resolved by getComputedStyle in all browsers,
  // so we create a temp element and read the actual computed color
  const temp = document.createElement('div')
  temp.style.display = 'none'
  temp.style.color = raw
  el.appendChild(temp)
  const resolved = getComputedStyle(temp).color
  el.removeChild(temp)
  return resolved
}

function getLineColor(
  el: Element,
  data: DataPoint[],
  trendDirection: 'lower-is-better' | 'higher-is-better'
): string {
  const green = resolveColor(el, '--theme-green-7')
  const red = resolveColor(el, '--theme-red-7')
  if (data.length < 2) return green
  const first = data[0].value
  const last = data[data.length - 1].value

  if (trendDirection === 'lower-is-better') {
    return last < first ? green : last > first ? red : green
  }
  return last > first ? green : last < first ? red : green
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
  const sortedDataRef = useRef<DataPoint[]>([])

  useEffect(() => {
    onCrosshairRef.current = onCrosshair
  }, [onCrosshair])

  const sortedData = useMemo(
    () => [...data].sort((a, b) => Date.parse(a.date) - Date.parse(b.date)),
    [data]
  )

  useEffect(() => {
    sortedDataRef.current = sortedData
  }, [sortedData])

  useEffect(() => {
    if (!containerRef.current || sortedData.length < 2) return

    const container = containerRef.current
    const width = container.clientWidth || 300
    const height = container.clientHeight || 200

    const timestamps = sortedData.map((d) => Date.parse(d.date) / 1000)
    const values = sortedData.map((d) => d.value)
    const lineColor = getLineColor(container, sortedData, trendDirection)

    const opts: uPlot.Options = {
      width,
      height,
      padding: [24, 24, 24, 24],
      cursor: {
        y: false,
        x: false,
        drag: { x: false, y: false },
        points: {
          size: 32,
          fill: lineColor,
          stroke: lineColor,
          width: 0,
        },
      },
      select: { show: false, left: 0, top: 0, width: 0, height: 0 },
      legend: { show: false },
      axes: [
        { show: false, grid: { show: false }, ticks: { show: false } },
        { show: false, grid: { show: false }, ticks: { show: false } },
      ],
      series: [
        {},
        {
          stroke: lineColor,
          width: 8,
          fill: undefined,
          points: {
            size: 24,
            space: 24,
            fill: '#fff',
            stroke: lineColor,
            width: 4,
          },
        },
      ],
      hooks: {
        setCursor: [
          (u: uPlot) => {
            const idx = u.cursor.idx
            const sd = sortedDataRef.current
            if (idx == null || idx < 0 || idx >= sd.length) {
              onCrosshairRef.current?.(null)
            } else {
              onCrosshairRef.current?.(sd[idx])
            }
          },
        ],
      },
    }

    const chart = new uPlot(opts, [timestamps, values], container)
    chartRef.current = chart

    const handleResize = () => {
      if (containerRef.current) {
        chart.setSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.destroy()
      chartRef.current = null
      onCrosshairRef.current?.(null)
    }
  }, [sortedData, trendDirection])

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
      <div className="graph-canvas" data-material="vibrant" ref={containerRef} />
    </div>
  )
}

export default GraphComponent
