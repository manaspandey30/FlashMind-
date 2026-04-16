import { Lightbulb } from 'lucide-react'
import { Badge } from '../ui/Badge'
import type { Card } from '../../api/client'

interface Props {
  card: Card
  flipped: boolean
  onClick: () => void
}

export function FlashCard({ card, flipped, onClick }: Props) {
  return (
    <div className="card-scene w-full" style={{ height: '340px' }}>
      <div className={`card-flip ${flipped ? 'flipped' : ''}`} onClick={onClick}>
        {/* FRONT */}
        <div
          className="card-face rounded-2xl p-8 flex flex-col justify-between cursor-pointer select-none"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center justify-between">
            <Badge variant={card.card_type}>{card.card_type}</Badge>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Click to reveal</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xl font-medium text-center leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {card.front}
            </p>
          </div>
          {card.hint && (
            <div
              className="flex items-center gap-2 text-sm mt-4 px-3 py-2 rounded-lg"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)' }}
            >
              <Lightbulb size={14} />
              <span>{card.hint}</span>
            </div>
          )}
        </div>

        {/* BACK */}
        <div
          className="card-face card-face-back rounded-2xl p-8 flex flex-col justify-between cursor-pointer select-none"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--accent)',
            boxShadow: '0 0 30px rgba(124,106,255,0.12)',
          }}
        >
          <div className="flex items-center justify-between">
            <Badge variant={card.card_type}>{card.card_type}</Badge>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Answer</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-lg leading-relaxed text-center" style={{ color: 'var(--text-primary)' }}>
              {card.back}
            </p>
          </div>
          <div className="h-6" />
        </div>
      </div>
    </div>
  )
}
