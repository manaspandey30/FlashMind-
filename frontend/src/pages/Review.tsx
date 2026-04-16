import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RotateCcw, Eye } from 'lucide-react'
import { startSession, submitAnswer, endSession } from '../api/client'
import { useReviewStore } from '../store/reviewStore'
import { FlashCard } from '../components/cards/FlashCard'
import { RatingBar } from '../components/cards/RatingBar'
import { Spinner } from '../components/ui/Spinner'
import type { SessionOut } from '../api/client'

export function Review() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const deckId = params.get('deck') ?? undefined

  const { sessionId, currentCard, totalCards, progress, isFlipped, setSession, setCurrentCard, flip, clear } = useReviewStore()

  const [loading, setLoading] = useState(false)
  const [rating, setRating] = useState(false)
  const [summary, setSummary] = useState<SessionOut | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Start session on mount
  useEffect(() => {
    if (sessionId) return
    setLoading(true)
    startSession(deckId)
      .then(res => {
        setSession(res.session_id, res.total_cards, res.first_card)
        setLoading(false)
      })
      .catch(e => {
        setError(e?.response?.data?.detail ?? 'No cards due for review.')
        setLoading(false)
      })
    return () => { /* don't clear on unmount so session persists on nav */ }
  }, [])

  // Keyboard shortcuts
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!currentCard) return
    if (e.code === 'Space') { e.preventDefault(); if (!isFlipped) flip() }
    if (isFlipped && !rating) {
      if (e.key === '1') handleRate(1)
      if (e.key === '2') handleRate(2)
      if (e.key === '3') handleRate(3)
      if (e.key === '4') handleRate(4)
    }
  }, [currentCard, isFlipped, rating])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  const handleRate = async (quality: number) => {
    if (!sessionId || !currentCard || rating) return
    setRating(true)

    const timeTaken = Date.now() - useReviewStore.getState().cardStartTime

    try {
      const res = await submitAnswer({ session_id: sessionId, card_id: currentCard.id, quality, time_taken_ms: timeTaken })

      if (!res.next_card) {
        // Session complete
        const final = await endSession(sessionId)
        setSummary(final)
        clear()
      } else {
        setCurrentCard(res.next_card, res.session_progress, res.session_total)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setRating(false)
    }
  }

  const handleEnd = async () => {
    if (!sessionId) { clear(); navigate('/'); return }
    try {
      const final = await endSession(sessionId)
      setSummary(final)
      clear()
    } catch {
      clear()
      navigate('/')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Spinner size={40} /></div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Nothing to review</p>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl" style={{ background: 'var(--accent)', color: '#fff' }}>
          Go to Dashboard
        </button>
      </div>
    )
  }

  // Summary screen
  if (summary) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="text-7xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Session Complete!</h1>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>Great work! Keep the streak going.</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Reviewed', value: summary.cards_reviewed },
              { label: 'Correct', value: summary.correct_count },
              { label: 'Accuracy', value: `${summary.accuracy}%` },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="text-2xl font-bold mb-1" style={{ color: 'var(--accent)' }}>{s.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setSummary(null); navigate('/review') }}
              className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              <RotateCcw size={16} /> Review Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3 rounded-xl font-semibold"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!currentCard) return null

  const pct = totalCards > 0 ? Math.round((progress / totalCards) * 100) : 0

  return (
    <div className="flex flex-col h-full p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {progress} / {totalCards}
          </span>
          <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: 'var(--accent)' }}
            />
          </div>
        </div>
        <button
          onClick={handleEnd}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col justify-center gap-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <FlashCard card={currentCard} flipped={isFlipped} onClick={() => !isFlipped && flip()} />
          </motion.div>
        </AnimatePresence>

        {/* Flip hint */}
        {!isFlipped && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={flip}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            <Eye size={16} />
            Show Answer <span className="text-xs opacity-50 ml-1">Space</span>
          </motion.button>
        )}

        {/* Rating */}
        <AnimatePresence>
          {isFlipped && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3"
            >
              <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                How well did you know this? <span className="opacity-50">(1–4)</span>
              </p>
              <RatingBar onRate={handleRate} disabled={rating} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
