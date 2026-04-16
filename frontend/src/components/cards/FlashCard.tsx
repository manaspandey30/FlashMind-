import { Lightbulb } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { useCardTilt } from '../../hooks/useCardTilt'
import type { Card } from '../../api/client'

interface Props {
  card: Card
  flipped: boolean
  onClick: () => void
}

export function FlashCard({ card, flipped, onClick }: Props) {
  const { ref, onMouseMove, onMouseLeave } = useCardTilt(8)

  return (
    <div
      className="card-scene"
      style={{ height: 340, width: '100%' }}
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={`card-flip ${flipped ? 'flipped' : ''}`}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
      >
        {/* FRONT */}
        <div
          className="card-face"
          style={{
            borderRadius: 20, padding: '32px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            userSelect: 'none',
            background: 'linear-gradient(145deg, rgba(28,28,40,0.95) 0%, rgba(22,22,31,0.95) 100%)',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Glare overlay */}
          <div
            data-glare="true"
            style={{
              position: 'absolute', inset: 0, borderRadius: 20,
              opacity: 0, pointerEvents: 'none', zIndex: 20,
              transition: 'opacity 0.3s',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Badge variant={card.card_type}>{card.card_type}</Badge>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Space or click to flip</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 20, fontWeight: 500, textAlign: 'center', lineHeight: 1.6, color: 'var(--text-primary)' }}>
              {card.front}
            </p>
          </div>
          {card.hint && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginTop: 16,
              padding: '10px 14px', borderRadius: 10,
              background: 'var(--accent-dim)', color: 'var(--accent-light)', fontSize: 13,
            }}>
              <Lightbulb size={14} />
              <span>{card.hint}</span>
            </div>
          )}
        </div>

        {/* BACK */}
        <div
          className="card-face card-face-back"
          style={{
            borderRadius: 20, padding: '32px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            userSelect: 'none',
            background: 'linear-gradient(145deg, rgba(30,26,50,0.98) 0%, rgba(22,20,40,0.98) 100%)',
            border: '1px solid var(--accent)',
            boxShadow: '0 0 40px rgba(124,106,255,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div data-glare="true" style={{ position: 'absolute', inset: 0, borderRadius: 20, opacity: 0, pointerEvents: 'none', zIndex: 20 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Badge variant={card.card_type}>{card.card_type}</Badge>
            <span style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 20,
              background: 'rgba(124,106,255,0.2)', color: 'var(--accent-light)', fontWeight: 600,
            }}>Answer</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 17, lineHeight: 1.7, textAlign: 'center', color: 'var(--text-primary)' }}>
              {card.back}
            </p>
          </div>
          <div style={{ height: 24 }} />
        </div>
      </div>
    </div>
  )
}
