import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Trash2, BookOpen, Play } from 'lucide-react'
import { getDecks, deleteDeck } from '../api/client'
import { TiltCard } from '../components/ui/TiltCard'
import { Spinner } from '../components/ui/Spinner'

function deckGradient(title: string) {
  const h = [...title].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return `linear-gradient(135deg, hsl(${h},70%,30%) 0%, hsl(${(h + 50) % 360},60%,20%) 100%)`
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

  if (isLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Spinner size={36} /></div>

  return (
    <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Decks</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            {decks?.length ?? 0} decks · {decks?.reduce((a, d) => a + d.card_count, 0) ?? 0} total cards
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 0 24px rgba(124,106,255,0.5)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/upload')}
          style={{
            padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14,
            background: 'linear-gradient(135deg, var(--accent) 0%, #a594ff 100%)',
            color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(124,106,255,0.35)',
          }}
        >
          + New Deck
        </motion.button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 28 }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search decks…"
          style={{
            width: '100%', paddingLeft: 40, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
            borderRadius: 12, fontSize: 14, outline: 'none',
            background: 'rgba(22,22,31,0.8)', border: '1px solid var(--border)',
            color: 'var(--text-primary)', backdropFilter: 'blur(10px)',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>No decks found</p>
          <p style={{ color: 'var(--text-secondary)' }}>Upload a PDF to create your first deck.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {filtered.map((deck, i) => (
          <motion.div
            key={deck.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <TiltCard
              style={{
                background: 'rgba(22,22,31,0.9)',
                border: '1px solid var(--border)',
                borderRadius: 18,
                backdropFilter: 'blur(12px)',
              }}
              onClick={() => navigate(`/decks/${deck.id}`)}
              maxTilt={13}
            >
              {/* Gradient header with glow */}
              <div
                style={{
                  height: 80, borderRadius: '16px 16px 0 0',
                  background: deckGradient(deck.title),
                  boxShadow: `inset 0 -20px 40px rgba(0,0,0,0.3)`,
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {/* Shimmer line */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
                }} />
              </div>

              <div style={{ padding: '18px 18px 16px' }}>
                <h3 style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {deck.title}
                </h3>
                {deck.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                    {deck.description}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 12, fontSize: 12, marginBottom: 14 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{deck.card_count} cards</span>
                  <span style={{ color: 'var(--green)' }}>{deck.mastered_count} mastered</span>
                  {deck.due_count > 0 && (
                    <span style={{ color: 'var(--accent-light)' }}>{deck.due_count} due</span>
                  )}
                </div>

                {/* Mastery bar */}
                {deck.card_count > 0 && (
                  <div style={{ height: 5, borderRadius: 99, background: 'var(--border)', marginBottom: 14, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      width: `${Math.round((deck.mastered_count / deck.card_count) * 100)}%`,
                      background: `linear-gradient(90deg, var(--green), #4ade80)`,
                      boxShadow: '0 0 8px rgba(34,197,94,0.5)',
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: '0 0 16px rgba(124,106,255,0.45)' }}
                    whileTap={{ scale: 0.96 }}
                    onClick={e => { e.stopPropagation(); navigate(`/review?deck=${deck.id}`) }}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 12, fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      background: 'linear-gradient(135deg, var(--accent), #a594ff)',
                      color: '#fff', border: 'none', cursor: 'pointer',
                    }}
                  >
                    <Play size={11} /> Review
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={e => { e.stopPropagation(); navigate(`/decks/${deck.id}`) }}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 12, fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                      border: '1px solid var(--border)', cursor: 'pointer',
                    }}
                  >
                    <BookOpen size={11} /> Browse
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04, background: 'rgba(239,68,68,0.2) !important' }}
                    whileTap={{ scale: 0.96 }}
                    onClick={e => {
                      e.stopPropagation()
                      if (confirm(`Delete "${deck.title}"?`)) remove(deck.id)
                    }}
                    style={{
                      padding: '8px 10px', borderRadius: 9,
                      background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                      border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={13} />
                  </motion.button>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
