import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Trophy, Flame, Clock, Target, TrendingUp, ArrowRight, Layers } from 'lucide-react'
import { getOverview, getDecks } from '../api/client'
import { StatCard } from '../components/ui/StatCard'
import { Spinner } from '../components/ui/Spinner'

function fmtTime(secs: number) {
  if (secs < 60) return `${secs}s`
  if (secs < 3600) return `${Math.round(secs / 60)}m`
  return `${(secs / 3600).toFixed(1)}h`
}

export function Dashboard() {
  const navigate = useNavigate()
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['overview'], queryFn: getOverview })
  const { data: decks } = useQuery({ queryKey: ['decks'], queryFn: getDecks })

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size={36} />
      </div>
    )
  }

  const recentDecks = decks?.slice(0, 4) ?? []

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {stats?.cards_due_today
            ? `You have ${stats.cards_due_today} cards due for review today.`
            : 'No cards due today — great work!'}
        </p>
      </motion.div>

      {/* CTA */}
      {(stats?.cards_due_today ?? 0) > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/review')}
          className="w-full mb-8 py-5 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3"
          style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, #a594ff 100%)',
            color: '#fff',
            boxShadow: '0 8px 32px rgba(124,106,255,0.35)',
          }}
        >
          <BookOpen size={22} />
          Start Review — {stats?.cards_due_today} cards
          <ArrowRight size={18} />
        </motion.button>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Cards Due" value={stats?.cards_due_today ?? 0} icon={<Target size={16} />} accent="var(--accent)" />
        <StatCard label="Mastered" value={stats?.mastered_cards ?? 0} icon={<Trophy size={16} />} accent="var(--green)" sub={`of ${stats?.total_cards ?? 0} total`} />
        <StatCard label="Streak" value={`${stats?.current_streak ?? 0}d`} icon={<Flame size={16} />} accent="var(--orange)" sub={`Best: ${stats?.longest_streak ?? 0} days`} />
        <StatCard label="Study Time" value={fmtTime(stats?.total_study_time_secs ?? 0)} icon={<Clock size={16} />} accent="#38bdf8" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Decks" value={stats?.total_decks ?? 0} icon={<Layers size={16} />} accent="#c084fc" />
        <StatCard label="Total Cards" value={stats?.total_cards ?? 0} icon={<BookOpen size={16} />} accent="var(--accent)" />
        <StatCard label="Sessions" value={stats?.total_sessions ?? 0} icon={<TrendingUp size={16} />} accent="var(--green)" />
        <StatCard label="Avg Accuracy" value={`${stats?.average_accuracy ?? 0}%`} icon={<Target size={16} />} accent="var(--yellow)" />
      </div>

      {/* Recent Decks */}
      {recentDecks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Recent Decks</h2>
            <button
              onClick={() => navigate('/decks')}
              className="text-sm flex items-center gap-1"
              style={{ color: 'var(--accent-light)' }}
            >
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentDecks.map((deck, i) => (
              <motion.div
                key={deck.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/decks/${deck.id}`)}
                className="p-5 rounded-xl cursor-pointer transition-all"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold truncate flex-1 mr-2" style={{ color: 'var(--text-primary)' }}>
                    {deck.title}
                  </h3>
                  {deck.due_count > 0 && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                      style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)' }}
                    >
                      {deck.due_count} due
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span>{deck.card_count} cards</span>
                  <span>{deck.mastered_count} mastered</span>
                </div>
                {deck.card_count > 0 && (
                  <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round((deck.mastered_count / deck.card_count) * 100)}%`,
                        background: 'var(--green)',
                      }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!decks || decks.length === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No decks yet</h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Upload a PDF to generate your first flashcard deck.</p>
          <button
            onClick={() => navigate('/upload')}
            className="px-6 py-3 rounded-xl font-semibold"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Upload PDF
          </button>
        </motion.div>
      )}
    </div>
  )
}
