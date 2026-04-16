import type { ReactNode } from 'react'

interface Props {
  label: string
  value: string | number
  icon: ReactNode
  accent?: string
  sub?: string
}

export function StatCard({ label, value, icon, accent = 'var(--accent)', sub }: Props) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${accent}22` }}
        >
          <span style={{ color: accent }}>{icon}</span>
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
        {sub && <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
      </div>
    </div>
  )
}
