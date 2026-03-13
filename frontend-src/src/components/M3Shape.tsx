import { CSSProperties, useEffect, useRef } from 'react'
import '@m3e/web/shape'

interface Props {
  name: string
  size?: number
  color?: string
  children?: React.ReactNode
  morphTo?: string
  hovered?: boolean
  style?: CSSProperties
}

export default function M3Shape({ name, size = 48, color, children, morphTo, hovered, style }: Props) {
  const ref = useRef<HTMLElement>(null)
  const activeName = hovered && morphTo ? morphTo : name

  // Update the name attribute directly for smooth morph transitions
  useEffect(() => {
    if (ref.current) {
      ref.current.setAttribute('name', activeName)
    }
  }, [activeName])

  return (
    <m3e-shape
      ref={ref}
      name={activeName}
      style={{
        '--m3e-shape-size': `${size}px`,
        '--m3e-shape-container-color': color,
        '--m3e-shape-transition': 'clip-path 450ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        display: 'block',
        marginBottom: 14,
        flexShrink: 0,
        ...style,
      } as CSSProperties}
    >
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {children}
      </div>
    </m3e-shape>
  )
}
