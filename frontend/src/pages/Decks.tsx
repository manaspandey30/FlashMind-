import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Trash2, BookOpen, Play } from 'lucide-react'
import { getDecks, deleteDeck } from '../api/client'
import { Spinner } from '../components/ui/Spinner'

function deckGradient(title: string) {
  const h = [...title].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  return `linear-gradient(135deg, hsl(${h},60%,25%) 0%, hsl(${(h + 40) % 360},55%,18%) 100%)`
}

export function Decks() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const { data: decks, isLoading } = useQuery({ queryKey: ['decks'], queryFn: getDecks })
  const { mutate: remove } = useMutation({
    mutationFn: deleteDeck,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['decks'] }),
  })

  const filtered = decks?.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.tags.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  if (isLoading) return <div className="flex items-center justify-center h-full"><Spinner size={36} /></div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Decks</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{decks?.length ?? 0} decks · {decks?.reduce((a, d) => a + d.card_count, 0) ?? 0} total cards</p>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="px-4 py-2 rounded-xl font-medium text-sm"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          + New Deck
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search decks…"
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>No decks found</p>
          <p style={{ color: 'var(--text-secondary)' }}>Upload a PDF to create your first deck.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((deck, i) => (
          <motion.div
            key={deck.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-2xl overflow-hidden cursor-pointer group"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
            onClick={() => navigate(`/decks/${deck.id}`)}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            {/* Gradient header */}
            <div className="h-20" style={{ background: deckGradient(deck.title) }} />

            <div className="p-5">
              <h3 className="font-semibold text-base mb-1 truncate" style={{ color: 'var(--text-primary)' }}>
                {deck.title}
              </h3>
              {deck.description && (
                <p className="text-sm line-clamp-2 mb-3" style={{ color: 'var(--text-secondary)' }}>{deck.description}</p>
              )}

              <div className="flex items-center gap-3 text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                <span>{deck.card_count} cards</span>
                <span style={{ color: 'var(--green)' }}>{deck.mastered_count} mastered</span>
                {deck.due_count > 0 && (
                  <span style={{ color: 'var(--accent-light)' }}>{deck.due_count} due</span>
                )}
              </div>

              {/* Mastery bar */}
              {deck.card_count > 0 && (
                <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((deck.mastered_count / deck.card_count) * 100)}%`,
                      background: 'var(--green)',
                    }}
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={e => { e.stopPropagation(); navigate(`/review?deck=${deck.id}`) }}
                  className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  <Play size={12} /> Review
                </button>
                <button
                  onClick={e => { e.stopPropagation(); navigate(`/decks/${deck.id}`) }}
                  className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  <BookOpen size={12} /> Browse
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    if (confirm(`Delete "${deck.title}"? This cannot be undone.`)) remove(deck.id)
                  }}
                  className="p-2 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
