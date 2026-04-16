import type { ReactNode, CSSProperties } from 'react'
import { useCardTilt } from '../../hooks/useCardTilt'

interface Props {
  children: ReactNode
  className?: string
  style?: CSSProperties
  onClick?: () => void
  maxTilt?: number
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function TiltCard({ children, className = '', style = {}, onClick, maxTilt = 14, onMouseEnter, onMouseLeave: externalLeave }: Props) {
  const { ref, onMouseMove, onMouseLeave } = useCardTilt(maxTilt)

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={() => { onMouseLeave(); externalLeave?.() }}
      onClick={onClick}
      className={className}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Glare overlay */}
      <div
        data-glare="true"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 20,
          borderRadius: 'inherit',
          transition: 'opacity 0.3s',
        }}
      />
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
