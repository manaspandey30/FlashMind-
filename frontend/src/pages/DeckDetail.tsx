import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Play, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { getDeck, getDeckCards, deleteCard } from '../api/client'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'

export function DeckDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: deck } = useQuery({ queryKey: ['deck', id], queryFn: () => getDeck(id!) })
  const { data: cards, isLoading } = useQuery({ queryKey: ['deck-cards', id], queryFn: () => getDeckCards(id!) })

  const { mutate: removeCard } = useMutation({
    mutationFn: deleteCard,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deck-cards', id] }); qc.invalidateQueries({ queryKey: ['decks'] }) },
  })

  const [expanded, setExpanded] = useState<string | null>(null)

  if (isLoading) return <div className="flex items-center justify-center h-full"><Spinner size={36} /></div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/decks')}
        className="flex items-center gap-2 text-sm mb-6"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeft size={16} /> Back to Decks
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{deck?.title}</h1>
          {deck?.description && <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{deck.description}</p>}
          <div className="flex items-center gap-4 mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span>{deck?.card_count ?? 0} cards</span>
            <span style={{ color: 'var(--green)' }}>{deck?.mastered_count ?? 0} mastered</span>
            {(deck?.due_count ?? 0) > 0 && <span style={{ color: 'var(--accent-light)' }}>{deck?.due_count} due today</span>}
          </div>
        </div>
        <button
          onClick={() => navigate(`/review?deck=${id}`)}
          className="px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 text-sm"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <Play size={15} /> Review Deck
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {cards?.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.025 }}
            className="rounded-xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div
              className="p-4 flex items-center gap-3 cursor-pointer"
              onClick={() => setExpanded(expanded === card.id ? null : card.id)}
            >
              <Badge variant={card.card_type}>{card.card_type}</Badge>
              <p className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {card.front}
              </p>
              <div className="flex items-center gap-2">
                {card.srs && <Badge variant={card.srs.state}>{card.srs.state}</Badge>}
                {expanded === card.id ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
              </div>
            </div>

            {expanded === card.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="px-4 pb-4 border-t"
                style={{ borderColor: 'var(--border)' }}
              >
                <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{card.back}</p>
                {card.hint && (
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>💡 {card.hint}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => { if (confirm('Delete this card?')) removeCard(card.id) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                  {card.srs && (
                    <span className="text-xs px-3 py-1.5" style={{ color: 'var(--text-muted)' }}>
                      Interval: {card.srs.interval}d · EF: {card.srs.ease_factor.toFixed(2)}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
