import { useEffect, useState, useCallback, useRef } from 'react'
import { fetchCurrent, fetchHistory } from './api'
import { CurrentWeather, HistoryData } from './types'
import { getTheme, injectCSSVars, P } from './theme'
import { tempLabel, humLabel, windLabel, luxLabel, calcFeelsLike, feelsLikeLabel, fmtSunshine } from './utils'
import SensorCard from './components/SensorCard'
import M3Shape from './components/M3Shape'
import HistoryChart from './components/HistoryChart'
import LegalModal from './components/LegalModal'
import appLogo from './assets/app-logo.png'

const RANGES = [
  { label: '6h',   hours: 6 },
  { label: '24h',  hours: 24 },
  { label: '7d',   hours: 168 },
  { label: '30d',  hours: 720 },
  { label: '90d',  hours: 2160 },
]

function useAnimatedNumber(target: number | null, duration = 1200, decimals = 1) {
  const [display, setDisplay] = useState<string | null>(null)
  const prevTarget = useRef<number | null>(null)
  useEffect(() => {
    if (target === null) { setDisplay(null); return }
    if (prevTarget.current === target) return
    prevTarget.current = target
    const start = performance.now()
    let raf: number
    const ease = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const v = target * ease(p)
      setDisplay(v.toFixed(decimals))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, decimals])
  return display
}

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const time = now.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const date = now.toLocaleDateString('de-AT', { weekday: 'short', day: 'numeric', month: 'short' })
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: '0.05em', fontVariantNumeric: 'tabular-nums', color: P.onSurface }}>{time}</div>
      <div style={{ fontSize: 11, color: P.outline, letterSpacing: '0.4px' }}>{date}</div>
    </div>
  )
}

function Unit({ unit }: { unit: string }) {
  return <span style={{ fontSize: 16, fontWeight: 400 }}>{unit}</span>
}

function ApiEndpoint({ url, description }: { url: string; description: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        background: P.surfaceContainer, borderRadius: 16, padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      }}>
        <span style={{
          height: 24, padding: '0 10px', borderRadius: 9999,
          background: P.primaryContainer, color: P.onPrimaryContainer,
          fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
          display: 'inline-flex', alignItems: 'center',
        }}>GET</span>
        <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 12, color: P.onSurface, wordBreak: 'break-all' }}>
          {url}
        </span>
        <button onClick={copy} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          height: 32, padding: '0 12px', borderRadius: 9999,
          border: `1px solid ${P.outlineVariant}`, background: 'none',
          color: P.primary, fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
          cursor: 'pointer',
        }}>
          <span className="material-icons-round" style={{ fontSize: 16 }}>{copied ? 'check' : 'content_copy'}</span>
          {copied ? 'Kopiert!' : 'Kopieren'}
        </button>
      </div>
      <div style={{ fontSize: 12, color: P.onSurfaceVariant, marginTop: 6, paddingLeft: 4 }}>
        {description}
      </div>
    </div>
  )
}

/** Section header matching original exactly */
function SectionHeader({ children }: { children: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: P.outline, margin: '32px 0 12px', paddingLeft: 4 }}>
      {children}
    </div>
  )
}

function FooterShapeButton({ label, onClick }: { label: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'none', border: 'none', color: P.primary,
        fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, padding: 0,
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}
    >
      <M3Shape name="9-sided-cookie" morphTo="flower" hovered={hovered} size={18} color={P.primary} style={{ marginBottom: 0 }} />
      {label}
    </button>
  )
}

export default function App() {
  const [current, setCurrent] = useState<CurrentWeather | null>(null)
  const [history, setHistory] = useState<HistoryData | null>(null)
  const [hours, setHours] = useState(24)
  const [legalOpen, setLegalOpen] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const styleRef = useRef<HTMLStyleElement | null>(null)

  // Time-of-day theming
  useEffect(() => {
    const update = () => {
      const t = getTheme(new Date().getHours())
      const css = injectCSSVars(t)
      if (!styleRef.current) {
        styleRef.current = document.createElement('style')
        document.head.appendChild(styleRef.current)
      }
      styleRef.current.textContent = `:root{${css}}`
      document.body.style.background = 'var(--m3-bg)'
      document.body.style.color = 'var(--m3-on-bg)'
      document.body.style.fontFamily = "'Google Sans', system-ui, sans-serif"
      document.body.style.margin = '0'
    }
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])

  // Global styles
  useEffect(() => {
    const s = document.createElement('style')
    s.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { -webkit-font-smoothing: antialiased; }
      @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.3;} }
    `
    document.head.appendChild(s)
    return () => { document.head.removeChild(s) }
  }, [])

  const loadCurrent = useCallback(async () => {
    try {
      setCurrent(await fetchCurrent())
      setError(false)
    } catch { setError(true) }
    finally { setLoading(false) }
  }, [])

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetchHistory(hours)
      setHistory(res.data)
    } catch (e) { console.error('history failed', e) }
  }, [hours])

  useEffect(() => { loadCurrent() }, [loadCurrent])
  useEffect(() => {
    const id = setInterval(loadCurrent, 30_000)
    return () => clearInterval(id)
  }, [loadCurrent])
  useEffect(() => { loadHistory() }, [loadHistory])
  useEffect(() => {
    const id = setInterval(loadHistory, 60_000)
    return () => clearInterval(id)
  }, [loadHistory])

  const temp = current?.temperature?.value != null ? parseFloat(current.temperature.value) : null
  const hum  = current?.humidity?.value != null ? parseFloat(current.humidity.value) : null
  const wind = current?.wind_speed?.value != null ? parseFloat(current.wind_speed.value) : null
  const lux  = current?.illuminance?.value != null ? parseFloat(current.illuminance.value) : null
  const isRain = current?.is_raining?.value === 'on'
  const rain = current?.rain_today
  const sun  = current?.sunshine_today
  const feels = (temp != null && hum != null && wind != null)
    ? Math.round(calcFeelsLike(temp, hum, wind) * 10) / 10
    : null

  const animTemp  = useAnimatedNumber(temp, 1200, 1)
  const animHum   = useAnimatedNumber(hum, 1000, 0)
  const animWind  = useAnimatedNumber(wind, 1100, 1)
  const animRain  = useAnimatedNumber(rain ?? null, 900, 1)
  const animLux   = useAnimatedNumber(lux, 1000, 0)
  const animFeels = useAnimatedNumber(feels, 1200, 1)

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Sticky Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: P.surfaceContainer,
        borderBottom: `1px solid ${P.outlineVariant}`,
        height: 64, padding: '0 20px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <img src={appLogo} alt="Logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
        <span style={{ fontSize: 22, fontWeight: 400, flex: 1, color: P.onSurface }}>Wetterstation Wien</span>
        <Clock />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          height: 32, padding: '0 12px', borderRadius: 9999,
          background: P.secondaryContainer, color: P.onSecondaryContainer,
          fontSize: 14, fontWeight: 500,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: error ? P.error : P.primary,
            animation: error ? 'none' : 'pulse 2s ease-in-out infinite',
          }} />
          Live
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* Warning banner */}
        <div style={{
          background: P.errorContainer, color: P.onErrorContainer,
          borderRadius: 28, padding: '16px 20px',
          display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 8,
          fontSize: 14, lineHeight: 1.55, letterSpacing: '.25px',
        }}>
          <span className="material-icons-round" style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>warning</span>
          Die angezeigten Wetterdaten stammen von einer eigenen Wetterstation und werden ohne Gewähr bereitgestellt. Messwerte können von offiziellen meteorologischen Daten abweichen und sind nicht zu 100 % genau.
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 64, color: P.onSurfaceVariant }}>
            <span className="material-icons-round" style={{ fontSize: 48, opacity: 0.3, animation: 'pulse 2s ease-in-out infinite' }}>cloud_queue</span>
            <p style={{ marginTop: 12, fontSize: 14 }}>Lade Wetterdaten…</p>
          </div>
        )}

        {!loading && <>
          {/* Section: Aktuell */}
          <SectionHeader>Aktuell</SectionHeader>

          {/* Hero Card */}
          <div style={{
            background: P.primaryContainer, borderRadius: 28, padding: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 24, flexWrap: 'wrap', marginBottom: 12,
          }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '.8px', textTransform: 'uppercase', color: P.onSurfaceVariant, marginBottom: 4 }}>
                Temperatur
              </div>
              <div style={{ fontSize: 72, fontWeight: 200, lineHeight: 1, letterSpacing: '-4px', color: P.onPrimaryContainer }}>
                {animTemp ?? '--'}
                <span style={{ fontSize: 30, fontWeight: 300, letterSpacing: 0, verticalAlign: 'super', marginLeft: 10 }}>°C</span>
              </div>
              {temp != null && (
                <div style={{ fontSize: 14, color: P.onSurfaceVariant, marginTop: 8 }}>{tempLabel(temp)}</div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {([
                ['water_drop', hum != null ? `${animHum ?? '--'}% Luftfeuchtigkeit` : '--'],
                ['air',        wind != null ? `${animWind ?? '--'} km/h ${windLabel(wind)}` : '--'],
                ['water',      rain != null ? `${animRain ?? '--'} mm Niederschlag` : '--'],
                ['wb_sunny',   sun != null ? `${fmtSunshine(sun)} Sonnenschein` : '--'],
                ['light_mode', lux != null ? `${animLux ?? '--'} lx Beleuchtung` : '--'],
              ] as const).map(([icon, text]) => (
                <div key={icon} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: P.onSecondaryContainer, fontWeight: 500 }}>
                  <span className="material-icons-round" style={{ fontSize: 18, color: P.primary }}>{icon}</span>
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Section: Sensoren */}
          <SectionHeader>Sensoren</SectionHeader>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
            gap: 12, marginBottom: 8, alignItems: 'stretch',
          }}>
            <SensorCard icon="thermostat" label="Temperatur"
              cardRadius="48px" cardBg={P.primaryContainer} cardOnBg={P.onPrimaryContainer}
              iconBg={P.primary} iconColor={P.onPrimary}
              iconShape="circle" iconMorphTo="pill"
              value={<>{animTemp ?? '--'}<Unit unit="°C" /></>}
              sub={temp != null ? tempLabel(temp) : undefined}
            />
            <SensorCard icon="water_drop" label="Luftfeuchtigkeit"
              cardRadius="48px 48px 12px 12px" cardBg={P.tertiaryContainer} cardOnBg={P.onTertiaryContainer}
              iconBg={P.tertiary} iconColor={P.onTertiary}
              iconShape="7-sided-cookie" iconMorphTo="9-sided-cookie"
              value={<>{animHum ?? '--'}<Unit unit="%" /></>}
              sub={hum != null ? humLabel(hum) : undefined}
            />
            <SensorCard icon="air" label="Windgeschwindigkeit"
              cardRadius="48px 48px 48px 8px" cardBg={P.secondaryContainer} cardOnBg={P.onSecondaryContainer}
              iconBg={P.secondary} iconColor={P.onSecondary}
              iconShape="arrow" iconMorphTo="very-sunny"
              value={<>{animWind ?? '--'}<Unit unit="km/h" /></>}
              sub={wind != null ? windLabel(wind) : undefined}
            />
            <SensorCard icon="water" label="Niederschlag"
              cardRadius="48px 8px 48px 8px" cardBg={P.tertiaryContainer} cardOnBg={P.onTertiaryContainer}
              iconBg={P.tertiary} iconColor={P.onTertiary}
              iconShape="pill" iconMorphTo="bun"
              value={<>{animRain ?? '--'}<Unit unit="mm" /></>}
              sub={
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  height: 32, padding: '0 12px', borderRadius: 9999,
                  background: isRain ? P.tertiaryContainer : P.primaryContainer,
                  color: isRain ? P.onTertiaryContainer : P.onPrimaryContainer,
                  fontSize: 14, fontWeight: 500, letterSpacing: '.1px',
                }}>
                  <span className="material-icons-round" style={{ fontSize: 16 }}>{isRain ? 'water_drop' : 'check_circle'}</span>
                  {isRain ? 'Regen' : 'Kein Regen'}
                </span>
              }
            />
            <SensorCard icon="wb_sunny" label="Sonnenschein"
              cardRadius="8px 8px 48px 48px" cardBg={P.primaryContainer} cardOnBg={P.onPrimaryContainer}
              iconBg={P.primary} iconColor={P.onPrimary}
              iconShape="sunny" iconMorphTo="very-sunny"
              value={<span style={{ fontSize: 28 }}>{sun != null ? fmtSunshine(sun) : '--'}</span>}
              sub="gesamt aufgezeichnet"
            />
            <SensorCard icon="light_mode" label="Beleuchtungsstärke"
              cardRadius="8px 48px 48px 48px" cardBg={P.secondaryContainer} cardOnBg={P.onSecondaryContainer}
              iconBg={P.secondary} iconColor={P.onSecondary}
              iconShape="8-leaf-clover" iconMorphTo="flower"
              value={<>{animLux ?? '--'}<Unit unit="lx" /></>}
              sub={lux != null ? luxLabel(lux) : undefined}
            />
            <SensorCard icon="device_thermostat" label="Gefühlte Temp."
              cardRadius="28px" cardBg={P.tertiaryContainer} cardOnBg={P.onTertiaryContainer}
              iconBg={P.tertiary} iconColor={P.onTertiary}
              iconShape="9-sided-cookie" iconMorphTo="8-leaf-clover"
              value={<>{animFeels ?? '--'}<Unit unit="°C" /></>}
              sub={feels != null && temp != null ? feelsLikeLabel(feels, temp) : undefined}
            />
          </div>

          {/* Section: Verlauf */}
          <SectionHeader>Verlauf</SectionHeader>

          {/* Charts grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Temperature chart (full-width) with embedded time range selector */}
            <div style={{
              gridColumn: '1 / -1',
              background: P.elevatedSurface, borderRadius: 28, padding: '20px 20px 12px',
              boxShadow: '0px 1px 2px rgba(0,0,0,.25), 0px 1px 3px 1px rgba(0,0,0,.12)',
              overflow: 'hidden',
            }}>
              {/* Header row: title + segmented button */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 16, flexWrap: 'wrap', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 500, color: P.onSurface }}>
                  <span className="material-icons-round" style={{ fontSize: 20, color: P.primary }}>show_chart</span>
                  Temperaturverlauf
                </div>
                {/* Segmented time range */}
                <div style={{
                  display: 'flex', border: `1px solid ${P.outline}`, borderRadius: 9999, overflow: 'hidden',
                }}>
                  {RANGES.map((r, i) => (
                    <button key={r.hours} onClick={() => setHours(r.hours)} style={{
                      height: 40, padding: '0 16px', border: 'none', cursor: 'pointer',
                      borderRight: i < RANGES.length - 1 ? `1px solid ${P.outline}` : 'none',
                      fontFamily: "'Google Sans', system-ui, sans-serif", fontSize: 14, fontWeight: 500,
                      letterSpacing: '.1px',
                      background: hours === r.hours ? P.secondaryContainer : 'transparent',
                      color: hours === r.hours ? P.onSecondaryContainer : P.onSurface,
                      display: 'flex', alignItems: 'center', gap: 8,
                      transition: 'background .15s',
                    }}>
                      {hours === r.hours && <span className="material-icons-round" style={{ fontSize: 16 }}>check</span>}
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ height: 150 }}>
                <HistoryChart points={history?.temperature ?? []} hours={hours} color={P.primary} unit="°C" label="" height={150} />
              </div>
            </div>

            {/* Humidity chart */}
            <div style={{
              background: P.elevatedSurface, borderRadius: 28, padding: '20px 20px 12px',
              boxShadow: '0px 1px 2px rgba(0,0,0,.25), 0px 1px 3px 1px rgba(0,0,0,.12)',
              overflow: 'hidden',
            }}>
              <HistoryChart points={history?.humidity ?? []} hours={hours} color={P.tertiary} unit="%" label="Luftfeuchtigkeit" icon="water_drop" height={130} />
            </div>

            {/* Wind chart */}
            <div style={{
              background: P.elevatedSurface, borderRadius: 28, padding: '20px 20px 12px',
              boxShadow: '0px 1px 2px rgba(0,0,0,.25), 0px 1px 3px 1px rgba(0,0,0,.12)',
              overflow: 'hidden',
            }}>
              <HistoryChart points={history?.wind_speed ?? []} hours={hours} color={P.secondary} unit="km/h" label="Windgeschwindigkeit" icon="air" height={130} />
            </div>
          </div>

          {/* Section: Public API */}
          <SectionHeader>Public API</SectionHeader>
          <div style={{
            background: P.surface, border: `1px solid ${P.outlineVariant}`, borderRadius: 28,
            padding: 24, overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span className="material-icons-round" style={{ fontSize: 24, color: P.primary }}>api</span>
              <span style={{ fontSize: 16, fontWeight: 500, color: P.onSurface, flex: 1 }}>Endpunkte</span>
              <span style={{
                height: 24, padding: '0 10px', borderRadius: 9999,
                background: P.tertiaryContainer, color: P.onTertiaryContainer,
                fontSize: 11, fontWeight: 500, letterSpacing: '.5px',
                display: 'inline-flex', alignItems: 'center',
              }}>CORS offen</span>
            </div>
            <ApiEndpoint
              url="https://api.treesinvienna.eu/api/weather/current"
              description="Aktuelle Wetterdaten: Temperatur, Luftfeuchtigkeit, Wind, Regen, Sonnenschein, Beleuchtung — mit Einheit & Zeitstempel."
            />
            <ApiEndpoint
              url="https://api.treesinvienna.eu/api/weather/history?hours=24"
              description="Zeitreihendaten bis 7 Tage: Temperatur, Luftfeuchtigkeit, Wind als Array mit Zeitstempeln."
            />
          </div>

          {/* Section: Daten exportieren */}
          <SectionHeader>Daten exportieren</SectionHeader>
          <div style={{
            background: P.surface, border: `1px solid ${P.outlineVariant}`, borderRadius: 28,
            padding: '20px 24px', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span className="material-icons-round" style={{ fontSize: 22, color: P.primary }}>download</span>
              <span style={{ fontSize: 16, fontWeight: 500, color: P.onSurface }}>Messdaten herunterladen</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[7, 30, 90, 365].map(d => (
                <div key={d} style={{ display: 'flex', gap: 6 }}>
                  <a href={`https://api.treesinvienna.eu/api/weather/export?format=csv&days=${d}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      height: 36, padding: '0 14px', borderRadius: 9999,
                      background: P.primaryContainer, color: P.onPrimaryContainer,
                      fontSize: 13, fontWeight: 500, textDecoration: 'none', fontFamily: 'inherit',
                    }}>
                    <span className="material-icons-round" style={{ fontSize: 16 }}>table_chart</span>
                    CSV {d}d
                  </a>
                  <a href={`https://api.treesinvienna.eu/api/weather/export?format=json&days=${d}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      height: 36, padding: '0 14px', borderRadius: 9999,
                      background: P.secondaryContainer, color: P.onSecondaryContainer,
                      fontSize: 13, fontWeight: 500, textDecoration: 'none', fontFamily: 'inherit',
                    }}>
                    <span className="material-icons-round" style={{ fontSize: 16 }}>data_object</span>
                    JSON {d}d
                  </a>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: P.onSurfaceVariant, marginTop: 12 }}>
              Alle Messwerte: Temperatur, Luftfeuchtigkeit, Wind, Regen, Beleuchtung — 5-Minuten-Intervall.
            </div>
          </div>

          {/* Section: App */}
          <SectionHeader>App</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* iOS card */}
            <a href="https://apps.apple.com/at/app/b%C3%A4ume-in-wien/id6759613964" target="_blank" rel="noopener noreferrer" style={{
              background: P.elevatedSurface, borderRadius: 28,
              boxShadow: '0px 1px 2px rgba(0,0,0,.25), 0px 1px 3px 1px rgba(0,0,0,.12)',
              display: 'flex', alignItems: 'center', gap: 16, padding: 20,
              textDecoration: 'none', color: 'inherit', overflow: 'hidden',
            }}>
              <img src={appLogo} alt="Bäume in Wien" style={{ width: 56, height: 56, borderRadius: 16, objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 500, color: P.onSurface }}>Bäume in Wien</div>
                <div style={{ fontSize: 12, color: P.onSurfaceVariant, letterSpacing: '.4px', marginTop: 2 }}>Entdecke Wiens Baumkataster — kostenlos im App Store</div>
              </div>
              <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store" style={{ height: 38, flexShrink: 0 }} />
            </a>
            {/* Android card */}
            <div style={{
              background: P.surface, border: `1px solid ${P.outlineVariant}`, borderRadius: 28,
              display: 'flex', alignItems: 'center', gap: 16, padding: 20,
              opacity: 0.55, overflow: 'hidden',
            }}>
              <img src={appLogo} alt="Bäume in Wien" style={{ width: 56, height: 56, borderRadius: 16, objectFit: 'cover', flexShrink: 0, filter: 'grayscale(1)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 500, color: P.onSurface }}>Bäume in Wien</div>
                <div style={{ fontSize: 12, color: P.onSurfaceVariant, letterSpacing: '.4px', marginTop: 2 }}>Android-Version in Entwicklung</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" style={{ height: 38, filter: 'grayscale(1)', opacity: 0.6 }} />
                <span style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '.5px',
                  background: P.surfaceContainerHighest, color: P.onSurfaceVariant,
                  padding: '2px 10px', borderRadius: 9999,
                }}>COMING SOON</span>
              </div>
            </div>
          </div>

          {/* Aktualisiert timestamp */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            gap: 6, marginTop: 12, fontSize: 11, color: P.outline, letterSpacing: '.5px',
          }}>
            <span className="material-icons-round" style={{ fontSize: 14 }}>schedule</span>
            {current?.fetched_at
              ? `Aktualisiert ${new Date(current.fetched_at).toLocaleTimeString('de-AT')}`
              : 'Lade Daten...'}
          </div>
        </>}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${P.outlineVariant}`,
        background: P.surfaceContainerLow,
        padding: '20px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        flexWrap: 'wrap', fontSize: 12, color: P.outline,
      }}>
        <span>© {new Date().getFullYear()} Trees in Vienna</span>
        <span style={{ color: P.outlineVariant }}>·</span>
        <FooterShapeButton label="Nutzungsbedingungen" onClick={() => setLegalOpen(true)} />
        <span style={{ color: P.outlineVariant }}>·</span>
        <FooterShapeButton label="Datenschutzerklärung" onClick={() => setLegalOpen(true)} />
        <span style={{ color: P.outlineVariant }}>·</span>
        <a href="tel:+437206990677" style={{ color: P.primary, fontSize: 12, fontWeight: 500, textDecoration: 'none', fontFamily: 'inherit' }}>
          +43 720 699 0677
        </a>
        <span style={{ color: P.outlineVariant }}>·</span>
        <a href="mailto:support@treesinvienna.eu" style={{ color: P.primary, fontSize: 12, fontWeight: 500, textDecoration: 'none', fontFamily: 'inherit' }}>
          support@treesinvienna.eu
        </a>
      </footer>

      <LegalModal open={legalOpen} onClose={() => setLegalOpen(false)} />
    </div>
  )
}
