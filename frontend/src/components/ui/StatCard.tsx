import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { TiltCard } from './TiltCard'

interface Props {
  label: string
  value: string | number
  icon: ReactNode
  accent?: string
  sub?: string
}

function CountUp({ target }: { target: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const duration = 900
    const step = 16
    const increment = target / (duration / step)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) { setDisplay(target); clearInterval(timer) }
      else setDisplay(Math.floor(start))
    }, step)
    return () => clearInterval(timer)
  }, [target])
  return <>{display}</>
}

export function StatCard({ label, value, icon, accent = 'var(--accent)', sub }: Props) {
  const isNumber = typeof value === 'number'
  return (
    <TiltCard
      className="rounded-xl p-5"
      style={{
        background: 'rgba(22,22,31,0.85)',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
      }}
      maxTilt={10}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
        <div
          style={{
            width: 34, height: 34, borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${accent}22`,
            boxShadow: `0 0 12px ${accent}33`,
            color: accent,
          }}
        >
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
        {isNumber ? <CountUp target={value as number} /> : value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
    </TiltCard>
  )
}
