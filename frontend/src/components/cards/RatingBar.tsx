import { motion } from 'framer-motion'

interface RatingButton {
  label: string
  quality: number
  color: string
  bg: string
  next: string
}

const ratings: RatingButton[] = [
  { label: 'Again', quality: 1, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', next: '<1m' },
  { label: 'Hard', quality: 2, color: '#f97316', bg: 'rgba(249,115,22,0.12)', next: '~10m' },
  { label: 'Good', quality: 3, color: '#22c55e', bg: 'rgba(34,197,94,0.12)', next: '1d' },
  { label: 'Easy', quality: 4, color: '#7c6aff', bg: 'rgba(124,106,255,0.12)', next: '4d' },
]

interface Props {
  onRate: (quality: number) => void
  disabled?: boolean
}

export function RatingBar({ onRate, disabled }: Props) {
  return (
    <div className="flex gap-3 w-full">
      {ratings.map((r, i) => (
        <motion.button
          key={r.quality}
          onClick={() => !disabled && onRate(r.quality)}
          disabled={disabled}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          whileHover={disabled ? {} : { scale: 1.04, y: -2 }}
          whileTap={disabled ? {} : { scale: 0.97 }}
          className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl text-sm font-semibold transition-opacity"
          style={{
            background: r.bg,
            color: r.color,
            border: `1px solid ${r.color}33`,
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {r.label}
          <span className="text-xs font-normal opacity-70">{r.next}</span>
        </motion.button>
      ))}
    </div>
  )
}
