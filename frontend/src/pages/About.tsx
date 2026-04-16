import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

const steps = [
  {
    icon: '📄',
    title: '1. Upload Your PDF',
    desc: 'Drop any PDF — textbook chapter, lecture slides, research paper. FlashMind handles the rest.',
  },
  {
    icon: '🤖',
    title: '2. AI Generates Cards',
    desc: 'Groq\'s LLM (llama-3.3-70b) reads your content and creates cards covering key concepts, definitions, relationships, worked examples, and edge cases.',
  },
  {
    icon: '🔁',
    title: '3. Spaced Repetition',
    desc: 'Every time you review a card, the SM-2 algorithm updates its schedule. Cards you know well fade. Cards you struggle with resurface — until you\'ve truly mastered them.',
  },
  {
    icon: '📈',
    title: '4. Track Your Progress',
    desc: 'Watch your mastery grow over time with heatmaps, retention curves, and deck breakdowns.',
  },
]

const sm2 = [
  { label: 'Ease Factor', desc: 'Starts at 2.5 per card. Goes up when you answer well, down when you struggle. Floor is 1.3.' },
  { label: 'Interval', desc: 'Days until next review. Starts at 1, then 6, then grows exponentially with the ease factor.' },
  { label: 'Quality Rating', desc: '0 (blackout) to 5 (perfect). Ratings 0–2 reset the card. Ratings 3–5 advance the schedule.' },
  { label: 'State', desc: 'New → Learning → Review → Mastered. Cards with interval ≥ 21 days are considered mastered.' },
]

export function About() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent)' }}
          >
            <Zap size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>FlashMind</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>AI-Powered Spaced Repetition Engine</p>
          </div>
        </div>
        <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Long-term retention beats short-term cramming. FlashMind turns any PDF into a smart study deck,
          then uses the science of spaced repetition to make sure you actually remember what you learn.
        </p>
      </motion.div>

      {/* How it works */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-5" style={{ color: 'var(--text-primary)' }}>How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-5 rounded-xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="text-2xl mb-3">{s.icon}</div>
              <h3 className="font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{s.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SM-2 explainer */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>The SM-2 Algorithm</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
          Developed by Piotr Woźniak in 1987, SM-2 is the same algorithm that powers Anki and SuperMemo.
          It models how human memory decays and schedules reviews at exactly the right moment — just before you forget.
        </p>
        <div className="flex flex-col gap-3">
          {sm2.map(item => (
            <div
              key={item.label}
              className="flex gap-4 p-4 rounded-xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-2 flex-shrink-0 rounded-full mt-1"
                style={{ background: 'var(--accent)', minHeight: '16px' }}
              />
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Card types */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-5" style={{ color: 'var(--text-primary)' }}>Card Types</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { type: 'Definition', desc: 'Precise definitions of key terms', color: '#38bdf8' },
            { type: 'Conceptual', desc: 'Why/how questions about mechanisms', color: '#fb923c' },
            { type: 'Example', desc: 'Worked examples and applications', color: '#22c55e' },
            { type: 'Cloze', desc: 'Fill-in-the-blank style', color: '#c084fc' },
            { type: 'Basic', desc: 'Standard question & answer', color: '#a594ff' },
            { type: 'Edge Case', desc: 'Misconceptions and boundaries', color: '#f59e0b' },
          ].map(c => (
            <div key={c.type} className="p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-semibold mb-1" style={{ color: c.color }}>{c.type}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech */}
      <section>
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Built With</h2>
        <div className="flex flex-wrap gap-2">
          {['Groq API (llama-3.3-70b)', 'FastAPI', 'React 18', 'SM-2 SRS', 'PyMuPDF', 'SQLite', 'Framer Motion', 'Recharts'].map(t => (
            <span
              key={t}
              className="px-3 py-1 rounded-full text-sm"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              {t}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}
