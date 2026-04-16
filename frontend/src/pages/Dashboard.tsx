import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Trophy, Flame, Clock, Target, TrendingUp, ArrowRight, Layers } from 'lucide-react'
import { getOverview, getDecks } from '../api/client'
import { StatCard } from '../components/ui/StatCard'
import { TiltCard } from '../components/ui/TiltCard'
import { Spinner } from '../components/ui/Spinner'

function fmtTime(s: number) {
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.round(s / 60)}m`
  return `${(s / 3600).toFixed(1)}h`
}

function deckGradient(title: string) {
  const h = [...title].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return `linear-gradient(135deg, hsl(${h},65%,28%) 0%, hsl(${(h + 50) % 360},55%,18%) 100%)`
}

export function Dashboard() {
  const navigate = useNavigate()
  const { data: stats, isLoading } = useQuery({ queryKey: ['overview'], queryFn: getOverview })
  const { data: decks } = useQuery({ queryKey: ['decks'], queryFn: getDecks })

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Spinner size={40} />
    </div>
  )

  const recentDecks = decks?.slice(0, 4) ?? []
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  return (
    <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Good {greeting} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
          {stats?.cards_due_today
            ? `You have ${stats.cards_due_today} cards due for review today.`
            : 'You\'re all caught up — great work!'}
        </p>
      </motion.div>

      {/* CTA button */}
      {(stats?.cards_due_today ?? 0) > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02, boxShadow: '0 12px 48px rgba(124,106,255,0.55)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/review')}
          style={{
            width: '100%', marginBottom: 32, padding: '20px 0',
            borderRadius: 18, fontWeight: 700, fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            background: 'linear-gradient(135deg, var(--accent) 0%, #a594ff 50%, #7c6aff 100%)',
            backgroundSize: '200% 200%',
            color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(124,106,255,0.4)',
          }}
        >
          <BookOpen size={22} />
          Start Review — {stats?.cards_due_today} cards due
          <ArrowRight size={18} />
        </motion.button>
      )}

      {/* Stats row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <StatCard label="Cards Due" value={stats?.cards_due_today ?? 0} icon={<Target size={16} />} accent="var(--accent)" />
        <StatCard label="Mastered" value={stats?.mastered_cards ?? 0} icon={<Trophy size={16} />} accent="var(--green)" sub={`of ${stats?.total_cards ?? 0} total`} />
        <StatCard label="Streak" value={`${stats?.current_streak ?? 0}d`} icon={<Flame size={16} />} accent="var(--orange)" sub={`Best: ${stats?.longest_streak ?? 0}d`} />
        <StatCard label="Study Time" value={fmtTime(stats?.total_study_time_secs ?? 0)} icon={<Clock size={16} />} accent="#38bdf8" />
      </div>

      {/* Stats row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
        <StatCard label="Total Decks" value={stats?.total_decks ?? 0} icon={<Layers size={16} />} accent="#c084fc" />
        <StatCard label="Total Cards" value={stats?.total_cards ?? 0} icon={<BookOpen size={16} />} accent="var(--accent)" />
        <StatCard label="Sessions" value={stats?.total_sessions ?? 0} icon={<TrendingUp size={16} />} accent="var(--green)" />
        <StatCard label="Avg Accuracy" value={`${stats?.average_accuracy ?? 0}%`} icon={<Target size={16} />} accent="var(--yellow)" />
      </div>

      {/* Recent Decks */}
      {recentDecks.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Recent Decks</h2>
            <motion.button
              whileHover={{ x: 3 }}
              onClick={() => navigate('/decks')}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, fontSize: 13,
                color: 'var(--accent-light)', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              View all <ArrowRight size={14} />
            </motion.button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {recentDecks.map((deck, i) => (
              <motion.div
                key={deck.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <TiltCard
                  onClick={() => navigate(`/decks/${deck.id}`)}
                  style={{
                    background: 'rgba(22,22,31,0.85)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    backdropFilter: 'blur(12px)',
                  }}
                  maxTilt={10}
                >
                  {/* Mini gradient strip */}
                  <div style={{ height: 4, background: deckGradient(deck.title), borderRadius: '14px 14px 0 0' }} />
                  <div style={{ padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <h3 style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 10 }}>
                        {deck.title}
                      </h3>
                      {deck.due_count > 0 && (
                        <span style={{
                          fontSize: 11, padding: '3px 8px', borderRadius: 20, flexShrink: 0,
                          background: 'var(--accent-dim)', color: 'var(--accent-light)', fontWeight: 600,
                        }}>
                          {deck.due_count} due
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                      <span>{deck.card_count} cards</span>
                      <span style={{ color: 'var(--green)' }}>{deck.mastered_count} mastered</span>
                    </div>
                    {deck.card_count > 0 && (
                      <div style={{ height: 4, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 99,
                          width: `${Math.round((deck.mastered_count / deck.card_count) * 100)}%`,
                          background: 'linear-gradient(90deg, var(--green), #4ade80)',
                          boxShadow: '0 0 8px rgba(34,197,94,0.4)',
                        }} />
                      </div>
                    )}
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!decks || decks.length === 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📚</div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>No decks yet</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Upload a PDF to generate your first flashcard deck.</p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 24px rgba(124,106,255,0.5)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/upload')}
            style={{
              padding: '12px 28px', borderRadius: 14, fontWeight: 600, fontSize: 15,
              background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
            }}
          >
            Upload PDF
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}
