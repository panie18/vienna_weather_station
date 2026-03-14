import { useState, useRef, useCallback, useEffect, ReactNode } from 'react'
import { P } from '../theme'
import M3Shape from './M3Shape'

interface Props {
  open: boolean
  onClose: () => void
}

type Tab = 'nutzung' | 'datenschutz'

function Ve({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.2px', marginBottom: 6, color: P.onSurface }}>
        {title}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.65, color: P.onSurfaceVariant }}>
        {children}
      </div>
    </div>
  )
}

function NutzungsTab() {
  return <>
    <Ve title="1. Geltungsbereich">
      Diese Nutzungsbedingungen gelten für die Nutzung des Wetterstation Wien Dashboards und der öffentlichen API unter api.treesinvienna.eu.
    </Ve>
    <Ve title="2. Datenverfügbarkeit">
      Die bereitgestellten Wetterdaten werden automatisch erfasst. Eine ständige Verfügbarkeit kann nicht garantiert werden. Es können jederzeit Wartungsarbeiten oder technische Störungen auftreten.
    </Ve>
    <Ve title="3. Genauigkeit der Daten">
      Die Sensordaten werden von einer HomematicIP HmIP-SWO-PL Wetterstation erfasst und ohne Gewähr bereitgestellt. Die Werte können von offiziellen Wetterdiensten abweichen.
    </Ve>
    <Ve title="4. API-Nutzung">
      Die öffentliche API darf frei genutzt werden. Bitte halte ein Abfrageintervall von mindestens 30 Sekunden ein und gib die Quelle (api.treesinvienna.eu) an, wenn du die Daten weiterverwendest.
    </Ve>
    <Ve title="5. Haftungsausschluss">
      Die Nutzung erfolgt auf eigene Gefahr. Für Schäden, die durch die Nutzung der Daten oder des Dienstes entstehen, wird keine Haftung übernommen.
    </Ve>
    <Ve title="6. Änderungen">
      Diese Nutzungsbedingungen können jederzeit angepasst werden. Änderungen werden auf dieser Seite veröffentlicht.
    </Ve>
    <Ve title="7. Kontakt">
      Bei Fragen: support@treesinvienna.eu · +43 720 699 0677
    </Ve>
  </>
}

function DatenschutzTab() {
  return <>
    <Ve title="1. Verantwortlicher">
      Paulify Dev · paulify.eu · support@treesinvienna.eu
    </Ve>
    <Ve title="2. Keine personenbezogenen Daten">
      Diese Website erhebt keine personenbezogenen Daten. Es werden keine Cookies gesetzt und kein Fingerprinting durchgeführt. Anonymisierte Nutzungsstatistiken werden über eine selbst gehostete Lösung erfasst (siehe Punkt 2a).
    </Ve>
    <Ve title="2a. Webanalyse (Umami)">
      Diese Website verwendet <strong>Umami</strong> (gehostet unter <strong>analytics.paulify.eu</strong>, Website-ID: <strong>d4e1fa85-999d-4e57-b22e-2be10db47023</strong>), eine datenschutzfreundliche, selbst gehostete Webanalyse-Lösung. Umami erfasst anonymisierte Nutzungsdaten wie Seitenaufrufe, Verweildauer und Gerätetyp — ohne Cookies, ohne Fingerprinting und ohne personenbezogene Daten. Die Daten werden auf einem eigenen Server in Europa verarbeitet und nicht an Dritte weitergegeben.
    </Ve>
    <Ve title="3. Hosting">
      Die Website wird auf einem eigenen Server in Österreich betrieben. Der Datenverkehr wird über <strong>Cloudflare</strong> (Cloudflare, Inc., USA) geleitet. Cloudflare kann dabei technische Daten wie IP-Adressen verarbeiten. Weitere Informationen: <strong>cloudflare.com/privacypolicy</strong>
    </Ve>
    <Ve title="4. Google Fonts">
      Diese Seite lädt Schriftarten von <strong>Google Fonts</strong> (Google LLC, USA). Dabei kann deine IP-Adresse an Google übermittelt werden. Weitere Informationen: <strong>policies.google.com/privacy</strong>
    </Ve>
    <Ve title="5. API-Daten">
      Die über die API bereitgestellten Wetterdaten enthalten keine personenbezogenen Informationen.
    </Ve>
    <Ve title="6. Deine Rechte">
      Gemäß DSGVO hast du das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung deiner personenbezogenen Daten — sofern welche erhoben wurden.
    </Ve>
    <Ve title="7. Beschwerderecht">
      Beschwerden können bei der österreichischen Datenschutzbehörde eingereicht werden: dsb.gv.at
    </Ve>
  </>
}

function CloseShapeButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 40, height: 40, border: 'none', background: 'none',
        cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <M3Shape name="6-sided-cookie" morphTo="flower" hovered={hovered} size={40} color={P.surfaceVariant} style={{ marginBottom: 0 }}>
        <span className="material-icons-round" style={{ fontSize: 20, color: P.onSurfaceVariant }}>close</span>
      </M3Shape>
    </button>
  )
}

export default function LegalModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('nutzung')
  const [phase, setPhase] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed')
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<{ y: number; time: number } | null>(null)
  const dragging = useRef(false)
  const dragY = useRef(0)

  useEffect(() => {
    if (open && phase === 'closed') {
      setPhase('opening')
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setPhase('open'))
      })
    }
  }, [open, phase])

  const close = useCallback(() => {
    setPhase('closing')
    setTimeout(() => {
      setPhase('closed')
      onClose()
    }, 300)
  }, [onClose])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragStart.current = { y: e.clientY, time: Date.now() }
    dragging.current = true
    dragY.current = 0
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !dragStart.current || !sheetRef.current) return
    const dy = Math.max(0, e.clientY - dragStart.current.y)
    dragY.current = dy
    sheetRef.current.style.transform = `translateY(${dy}px)`
    sheetRef.current.style.transition = 'none'
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !dragStart.current || !sheetRef.current) return
    dragging.current = false
    const dy = e.clientY - dragStart.current.y
    const dt = (Date.now() - dragStart.current.time) / 1000
    const velocity = dy / dt

    sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)'

    if (dy > 100 || velocity > 600) {
      sheetRef.current.style.transform = `translateY(100%)`
      setTimeout(() => {
        setPhase('closed')
        onClose()
        if (sheetRef.current) {
          sheetRef.current.style.transform = ''
          sheetRef.current.style.transition = ''
        }
      }, 300)
    } else {
      sheetRef.current.style.transform = 'translateY(0)'
    }
    dragStart.current = null
  }, [onClose])

  if (phase === 'closed') return null

  const isVisible = phase === 'open'

  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: 'nutzung', icon: 'gavel', label: 'Nutzung' },
    { id: 'datenschutz', icon: 'privacy_tip', label: 'Datenschutz' },
  ]

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: isVisible ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
        backdropFilter: isVisible ? 'blur(4px)' : 'blur(0px)',
        transition: 'background 0.3s, backdrop-filter 0.3s',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 1000,
        touchAction: 'none',
      }}
      onClick={close}
    >
      <div
        ref={sheetRef}
        style={{
          background: P.surfaceContainerLowest,
          borderRadius: '28px 28px 0 0',
          width: '100%',
          maxWidth: 680,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.2, 0, 0, 1)',
          willChange: 'transform',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div
          style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', cursor: 'grab', touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div style={{ width: 32, height: 4, borderRadius: 2, background: P.outlineVariant }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-icons-round" style={{ fontSize: 22, color: P.primary }}>
              {tab === 'nutzung' ? 'gavel' : 'privacy_tip'}
            </span>
            <span style={{ fontSize: 18, fontWeight: 500, color: P.onSurface }}>
              {tab === 'nutzung' ? 'Nutzungsbedingungen' : 'Datenschutzerklärung'}
            </span>
          </div>
          <CloseShapeButton onClick={close} />
        </div>

        {/* Segmented Button Tabs — same design as stats time range */}
        <div style={{ padding: '0 24px 12px' }}>
          <div style={{
            display: 'flex', border: `1px solid ${P.outline}`, borderRadius: 9999, overflow: 'hidden',
          }}>
            {TABS.map((t, i) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1,
                height: 40, padding: '0 16px', border: 'none', cursor: 'pointer',
                borderRight: i < TABS.length - 1 ? `1px solid ${P.outline}` : 'none',
                fontFamily: "'Google Sans', system-ui, sans-serif", fontSize: 14, fontWeight: 500,
                letterSpacing: '.1px',
                background: tab === t.id ? P.secondaryContainer : 'transparent',
                color: tab === t.id ? P.onSecondaryContainer : P.onSurface,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background .15s',
              }}>
                {tab === t.id && <span className="material-icons-round" style={{ fontSize: 16 }}>check</span>}
                <span className="material-icons-round" style={{ fontSize: 16 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px 32px' }}>
          {tab === 'nutzung' ? <NutzungsTab /> : <DatenschutzTab />}
        </div>
      </div>
    </div>
  )
}
