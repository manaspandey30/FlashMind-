import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { getHistory, getSessionDetail } from '../api/client'
import { Spinner } from '../components/ui/Spinner'

function fmtDur(s: number) {
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function SessionRow({ session }: { session: any }) {
  const [open, setOpen] = useState(false)
  const { data: detail, isFetching } = useQuery({
    queryKey: ['session', session.id],
    queryFn: () => getSessionDetail(session.id),
    enabled: open,
  })

  const qualityLabel = (q: number) => ['⛔', '😞', '😐', '🙂', '😊', '🌟'][q] ?? q

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div
        className="p-4 flex items-center gap-4 cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent-dim)' }}
        >
          <BookOpen size={16} style={{ color: 'var(--accent)' }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {session.deck_title || 'All Decks'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmtDate(session.started_at)}</p>
        </div>

        <div className="flex items-center gap-5 text-sm">
          <div className="text-center">
            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{session.cards_reviewed}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>cards</div>
          </div>
          <div className="text-center">
            <div className="font-semibold" style={{ color: session.accuracy >= 70 ? 'var(--green)' : session.accuracy >= 40 ? 'var(--yellow)' : 'var(--red)' }}>
              {session.accuracy}%
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>accuracy</div>
          </div>
          <div className="text-center hidden sm:block">
            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{fmtDur(session.duration_secs)}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>duration</div>
          </div>
        </div>

        {open ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t overflow-hidden"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="p-4">
              {isFetching ? (
                <div className="flex justify-center py-4"><Spinner size={24} /></div>
              ) : (
                <div className="flex flex-col gap-2">
                  {detail?.reviews.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 text-sm">
                      <span>{qualityLabel(r.quality)}</span>
                      <span className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{r.card_front}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {(r.time_taken_ms / 1000).toFixed(1)}s
                      </span>
                    </div>
                  ))}
                  {(!detail?.reviews || detail.reviews.length === 0) && (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No detailed records.</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function History() {
  const { data: sessions, isLoading } = useQuery({ queryKey: ['history'], queryFn: () => getHistory({ limit: 100 }) })

  if (isLoading) return <div className="flex items-center justify-center h-full"><Spinner size={36} /></div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>History</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{sessions?.length ?? 0} study sessions</p>
      </div>

      {!sessions?.length ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📖</div>
          <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>No sessions yet</p>
          <p style={{ color: 'var(--text-secondary)' }}>Complete a review session to see your history here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <SessionRow session={s} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
