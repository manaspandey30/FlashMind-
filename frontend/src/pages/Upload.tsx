import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload as UploadIcon, FileText, CheckCircle, AlertCircle, ArrowRight, X } from 'lucide-react'
import { uploadPDF, getUploadStatus } from '../api/client'

type Stage = 'idle' | 'uploading' | 'parsing' | 'generating' | 'saving' | 'done' | 'error'

const STAGE_MESSAGES: Record<Stage, string> = {
  idle: '',
  uploading: 'Uploading PDF…',
  parsing: 'Parsing PDF structure…',
  generating: 'Generating flashcards with AI…',
  saving: 'Saving cards to your library…',
  done: 'Your deck is ready!',
  error: 'Something went wrong.',
}

export function Upload() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [deckId, setDeckId] = useState<string | null>(null)
  const [cardsGenerated, setCardsGenerated] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) setFile(files[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: stage !== 'idle',
  })

  const start = async () => {
    if (!file) return
    setStage('uploading')
    setError(null)

    try {
      const { job_id } = await uploadPDF(file)
      setStage('parsing')

      // Poll for status
      const poll = setInterval(async () => {
        const status = await getUploadStatus(job_id)
        setProgress(status.progress)
        setMessage(status.message)
        setCardsGenerated(status.cards_generated)

        if (status.status === 'done') {
          clearInterval(poll)
          setStage('done')
          setDeckId(status.deck_id)
        } else if (status.status === 'error') {
          clearInterval(poll)
          setStage('error')
          setError(status.error ?? 'Unknown error')
        } else {
          setStage(status.status as Stage)
        }
      }, 800)
    } catch (e: any) {
      setStage('error')
      setError(e?.response?.data?.detail ?? 'Upload failed')
    }
  }

  const reset = () => {
    setFile(null)
    setStage('idle')
    setProgress(0)
    setMessage('')
    setDeckId(null)
    setCardsGenerated(0)
    setError(null)
  }

  const isProcessing = !['idle', 'done', 'error'].includes(stage)

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Upload PDF</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Drop any PDF — textbook chapter, lecture notes, research paper — and get a smart deck of flashcards.
        </p>
      </motion.div>

      {/* Drop zone */}
      <AnimatePresence mode="wait">
        {stage === 'idle' && (
          <motion.div key="dropzone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div
              {...getRootProps()}
              className="rounded-2xl p-12 text-center cursor-pointer transition-all duration-200"
              style={{
                border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`,
                background: isDragActive ? 'var(--accent-dim)' : 'var(--bg-card)',
              }}
            >
              <input {...getInputProps()} />
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--accent-dim)' }}
              >
                <UploadIcon size={28} style={{ color: 'var(--accent)' }} />
              </div>
              <p className="font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
                {isDragActive ? 'Drop it here' : 'Drag & drop your PDF'}
              </p>
              <p style={{ color: 'var(--text-secondary)' }}>
                or <span style={{ color: 'var(--accent-light)' }}>browse files</span>
              </p>
              <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>PDF only · Max 50 MB</p>
            </div>

            {file && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl flex items-center gap-3"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(239,68,68,0.12)' }}
                >
                  <FileText size={18} style={{ color: '#ef4444' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button onClick={reset} style={{ color: 'var(--text-muted)' }}>
                  <X size={16} />
                </button>
              </motion.div>
            )}

            {file && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={start}
                className="w-full mt-4 py-4 rounded-xl font-semibold text-lg"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                Generate Flashcards
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Processing */}
        {isProcessing && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl p-10 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="mb-6">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <svg className="w-20 h-20 -rotate-90">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" strokeWidth="4" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke="var(--accent)" strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>
                <span
                  className="absolute inset-0 flex items-center justify-center font-bold"
                  style={{ color: 'var(--accent)' }}
                >
                  {progress}%
                </span>
              </div>
              <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                {STAGE_MESSAGES[stage]}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{message}</p>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: 'var(--accent)' }}
              />
            </div>
          </motion.div>
        )}

        {/* Done */}
        {stage === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-10 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--green)' }}
          >
            <CheckCircle size={52} className="mx-auto mb-4" style={{ color: 'var(--green)' }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Deck created!</h2>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              Generated <strong style={{ color: 'var(--green)' }}>{cardsGenerated} high-quality flashcards</strong> from your PDF.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => deckId && navigate(`/decks/${deckId}`)}
                className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                View Deck <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/review')}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              >
                Start Review
              </button>
            </div>
            <button onClick={reset} className="mt-3 text-sm w-full" style={{ color: 'var(--text-muted)' }}>
              Upload another PDF
            </button>
          </motion.div>
        )}

        {/* Error */}
        {stage === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl p-10 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--red)' }}
          >
            <AlertCircle size={52} className="mx-auto mb-4" style={{ color: 'var(--red)' }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Generation failed</h2>
            <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>{error}</p>
            <button
              onClick={reset}
              className="px-8 py-3 rounded-xl font-semibold"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips */}
      {stage === 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.2 } }}
          className="mt-8 grid grid-cols-3 gap-4"
        >
          {[
            { icon: '🎯', title: 'Key concepts', desc: 'Definitions, relationships, and mechanisms' },
            { icon: '💡', title: 'Worked examples', desc: 'Applied problems and edge cases' },
            { icon: '🔁', title: 'Spaced repetition', desc: 'Cards scheduled by SM-2 algorithm' },
          ].map(item => (
            <div
              key={item.title}
              className="p-4 rounded-xl text-center"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
