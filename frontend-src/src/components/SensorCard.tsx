import { ReactNode, useState } from 'react'
import { P } from '../theme'
import M3Shape from './M3Shape'

interface Props {
  icon: string
  label: string
  value: ReactNode
  sub?: ReactNode
  cardRadius?: string
  cardBg?: string
  cardOnBg?: string
  iconBg?: string
  iconColor?: string
  iconShape?: string
  iconMorphTo?: string
}

export default function SensorCard({
  icon, label, value, sub,
  cardRadius = '28px',
  cardBg, cardOnBg, iconBg, iconColor,
  iconShape = 'circle', iconMorphTo,
}: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        background: cardBg ?? P.elevatedSurface,
        color: cardOnBg ?? P.onSurfaceVariant,
        borderRadius: cardRadius,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        height: '100%',
        boxSizing: 'border-box',
        boxShadow: cardBg ? 'none' : '0px 1px 2px rgba(0,0,0,.18), 0px 1px 3px 1px rgba(0,0,0,.08)',
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <M3Shape
        name={iconShape}
        morphTo={iconMorphTo}
        hovered={hovered}
        size={48}
        color={iconBg ?? P.primaryContainer}
        style={{ marginBottom: 14 }}
      >
        <span className="material-icons-round" style={{ fontSize: 22, color: iconColor ?? P.onPrimaryContainer }}>
          {icon}
        </span>
      </M3Shape>

      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '0.8px',
        textTransform: 'uppercase', marginBottom: 2, opacity: 0.75,
      }}>
        {label}
      </div>

      <div style={{ fontSize: 32, fontWeight: 300, lineHeight: 1, letterSpacing: '-1px' }}>
        {value}
      </div>

      {sub && (
        <div style={{ marginTop: 8, fontSize: 12 }}>
          {sub}
        </div>
      )}
    </div>
  )
}
