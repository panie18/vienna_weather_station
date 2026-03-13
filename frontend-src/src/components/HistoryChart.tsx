import { useEffect, useRef } from 'react'
import {
  Chart, LineController, LineElement, PointElement, Filler,
  LinearScale, TimeScale, Tooltip, Legend,
} from 'chart.js'
import 'chartjs-adapter-date-fns'
import { HistoryPoint } from '../types'
import { P } from '../theme'

Chart.register(LineController, LineElement, PointElement, Filler, LinearScale, TimeScale, Tooltip, Legend)

interface Props {
  points: HistoryPoint[]
  hours: number
  color: string
  unit: string
  label: string
  icon?: string
  height?: number
}

/** Resolve a CSS variable like var(--m3-pri) to its computed hex value */
function resolveColor(c: string): string {
  if (!c.startsWith('var(')) return c
  const varName = c.replace(/^var\(/, '').replace(/\)$/, '')
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#888'
}

export default function HistoryChart({ points, hours, color, unit, label, icon, height = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (chartRef.current) {
      chartRef.current.destroy()
    }

    const resolved = resolveColor(color)
    const style = getComputedStyle(document.documentElement)
    const tickColor = style.getPropertyValue('--m3-out').trim() || '#6E7B6F'
    const gridColor = style.getPropertyValue('--m3-out-var').trim() || '#BEC9BF'
    const bodyColor = style.getPropertyValue('--m3-on-surf').trim() || '#1A1E1A'
    const bgColor = style.getPropertyValue('--m3-sc-lowest').trim() || '#FFFFFF'

    chartRef.current = new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [{
          data: points.map(p => ({ x: new Date(p.t).getTime(), y: p.v })),
          borderColor: resolved,
          borderWidth: 2.5,
          backgroundColor: resolved + '22',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: resolved,
          pointHoverBorderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: bgColor,
            borderColor: gridColor,
            borderWidth: 1,
            titleColor: tickColor,
            bodyColor: bodyColor,
            padding: 12,
            cornerRadius: 12,
            titleFont: { family: 'Google Sans', size: 11 },
            bodyFont: { family: 'Google Sans', size: 14, weight: 500 },
            displayColors: false,
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y} ${unit}`,
            },
          },
        },
        scales: {
          x: {
            type: 'time',
            min: new Date(Date.now() - hours * 3600_000).getTime(),
            max: Date.now(),
            time: {
              unit: hours >= 48 ? 'day' : 'hour',
              displayFormats: { hour: 'HH:mm', day: 'dd. MMM' },
              tooltipFormat: 'HH:mm dd.MM',
            },
            grid: { color: gridColor + '44' },
            border: { display: false },
            ticks: {
              font: { family: 'Google Sans', size: 11 },
              color: tickColor,
              maxTicksLimit: 7,
            },
          },
          y: {
            grid: { color: gridColor + '44' },
            border: { display: false },
            ticks: {
              font: { family: 'Google Sans', size: 11 },
              color: tickColor,
              callback: (v) => `${parseFloat(Number(v).toPrecision(4))} ${unit}`,
            },
          },
        },
      },
    })

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [points, hours, color, unit])

  if (!points || points.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.onSurfaceVariant, fontSize: 14 }}>
        Keine Daten verfügbar
      </div>
    )
  }

  return (
    <div>
      {label && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 16, fontWeight: 500, color: P.onSurface, marginBottom: 16,
        }}>
          <span className="material-icons-round" style={{ fontSize: 20, color: P.primary }}>{icon || 'show_chart'}</span>
          {label}
        </div>
      )}
      <div style={{ height }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
