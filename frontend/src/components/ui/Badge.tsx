import type { ReactNode } from 'react'

const colorMap: Record<string, string> = {
  new: 'rgba(139,139,167,0.2)',
  learning: 'rgba(234,179,8,0.18)',
  review: 'rgba(124,106,255,0.2)',
  mastered: 'rgba(34,197,94,0.18)',
  basic: 'rgba(124,106,255,0.15)',
  definition: 'rgba(14,165,233,0.18)',
  conceptual: 'rgba(249,115,22,0.18)',
  example: 'rgba(34,197,94,0.18)',
  cloze: 'rgba(168,85,247,0.18)',
}
const textMap: Record<string, string> = {
  new: '#8b8ba7',
  learning: '#eab308',
  review: '#a594ff',
  mastered: '#22c55e',
  basic: '#a594ff',
  definition: '#38bdf8',
  conceptual: '#fb923c',
  example: '#22c55e',
  cloze: '#c084fc',
}

interface Props {
  variant?: string
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'basic', children, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${className}`}
      style={{
        background: colorMap[variant] ?? 'rgba(124,106,255,0.15)',
        color: textMap[variant] ?? '#a594ff',
      }}
    >
      {children}
    </span>
  )
}
