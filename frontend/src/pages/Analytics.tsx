import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { motion } from 'framer-motion'
import { getOverview, getHeatmap, getDailyCards, getDeckMastery } from '../api/client'
import { StatCard } from '../components/ui/StatCard'
import { Spinner } from '../components/ui/Spinner'
import { Trophy, Flame, Clock, BarChart3 } from 'lucide-react'

function fmtTime(s: number) {
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.round(s / 60)}m`
  return `${(s / 3600).toFixed(1)}h`
}

// GitHub-style heatmap
function Heatmap({ data }: { data: { date: string; count: number }[] }) {
  const map = Object.fromEntries(data.map(d => [d.date, d.count]))
  const today = new Date()
  const cells: { date: string; count: number; col: number; row: number }[] = []

  for (let w = 51; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const dt = new Date(today)
      dt.setDate(dt.getDate() - (w * 7 + (6 - d)))
      const key = dt.toISOString().slice(0, 10)
      cells.push({ date: key, count: map[key] ?? 0, col: 51 - w, row: d })
    }
  }

  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="overflow-x-auto">
      <svg width={52 * 14} height={7 * 14 + 20} style={{ display: 'block' }}>
        {cells.map(c => {
          const intensity = c.count === 0 ? 0 : 0.2 + (c.count / maxCount) * 0.8
          return (
            <rect
              key={c.date}
              x={c.col * 14}
              y={c.row * 14}
              width={12}
              height={12}
              rx={2}
              fill={c.count === 0 ? 'var(--border)' : `rgba(124,106,255,${intensity})`}
            >
              <title>{c.date}: {c.count} session{c.count !== 1 ? 's' : ''}</title>
            </rect>
          )
        })}
      </svg>
    </div>
  )
}

const COLORS = { new: '#5a5a72', learning: '#eab308', review: '#7c6aff', mastered: '#22c55e' }

export function Analytics() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['overview'], queryFn: getOverview })
  const { data: heatmap } = useQuery({ queryKey: ['heatmap'], queryFn: getHeatmap })
  const { data: daily } = useQuery({ queryKey: ['daily-cards'], queryFn: getDailyCards })
  const { data: deckMastery } = useQuery({ queryKey: ['deck-mastery'], queryFn: getDeckMastery })

  if (isLoading) return <div className="flex items-center justify-center h-full"><Spinner size={36} /></div>

  const tooltipStyle = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text-primary)',
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Analytics</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Your study performance at a glance.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Longest Streak" value={`${stats?.longest_streak ?? 0}d`} icon={<Flame size={16} />} accent="var(--orange)" />
        <StatCard label="Mastered" value={stats?.mastered_cards ?? 0} icon={<Trophy size={16} />} accent="var(--green)" />
        <StatCard label="Total Study Time" value={fmtTime(stats?.total_study_time_secs ?? 0)} icon={<Clock size={16} />} accent="#38bdf8" />
        <StatCard label="Avg Accuracy" value={`${stats?.average_accuracy ?? 0}%`} icon={<BarChart3 size={16} />} accent="var(--accent)" />
      </div>

      {/* Heatmap */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Study Activity (Last 52 weeks)</h2>
        <Heatmap data={heatmap ?? []} />
        <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>Less</span>
          {[0.1, 0.3, 0.5, 0.7, 1.0].map(a => (
            <div key={a} className="w-3 h-3 rounded-sm" style={{ background: `rgba(124,106,255,${a})` }} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily cards chart */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Cards Reviewed (Last 30 days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={daily ?? []} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={28} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="reviewed" fill="var(--accent)" radius={[3, 3, 0, 0]} name="Reviewed" />
              <Bar dataKey="correct" fill="var(--green)" radius={[3, 3, 0, 0]} name="Correct" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Deck mastery breakdown */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Deck Mastery</h2>
          {!deckMastery?.length ? (
            <div className="flex items-center justify-center h-40" style={{ color: 'var(--text-muted)' }}>No decks yet</div>
          ) : (
            <div className="flex flex-col gap-3">
              {deckMastery.map(deck => (
                <div key={deck.deck_id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="truncate flex-1 mr-2" style={{ color: 'var(--text-secondary)' }}>{deck.deck_title}</span>
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {deck.total > 0 ? Math.round((deck.mastered_count / deck.total) * 100) : 0}% mastered
                    </span>
                  </div>
                  {deck.total > 0 && (
                    <div className="flex h-2 rounded-full overflow-hidden gap-px">
                      {(['mastered', 'review', 'learning', 'new'] as const).map(state => {
                        const count = deck[`${state}_count` as keyof typeof deck] as number
                        const pct = (count / deck.total) * 100
                        return pct > 0 ? (
                          <div
                            key={state}
                            style={{ width: `${pct}%`, background: COLORS[state] }}
                            title={`${state}: ${count}`}
                          />
                        ) : null
                      })}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {Object.entries(COLORS).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: v }} />
                    {k}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
