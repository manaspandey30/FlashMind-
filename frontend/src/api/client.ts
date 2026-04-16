import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Types ─────────────────────────────────────────────────────────────────

export interface Deck {
  id: string
  title: string
  description: string
  source_file: string
  tags: string
  card_count: number
  created_at: string
  updated_at: string
  due_count: number
  mastered_count: number
}

export interface SRS {
  ease_factor: number
  interval: number
  repetitions: number
  due_date: string
  state: 'new' | 'learning' | 'review' | 'mastered'
}

export interface Card {
  id: string
  deck_id: string
  front: string
  back: string
  card_type: string
  hint: string
  tags: string
  created_at: string
  srs: SRS | null
}

export interface UploadStatus {
  job_id: string
  status: 'queued' | 'parsing' | 'generating' | 'saving' | 'done' | 'error'
  progress: number
  message: string
  deck_id: string | null
  cards_generated: number
  error: string | null
}

export interface SessionOut {
  id: string
  deck_id: string | null
  deck_title: string
  started_at: string
  ended_at: string | null
  cards_reviewed: number
  correct_count: number
  duration_secs: number
  accuracy: number
}

export interface ReviewAnswerOut {
  next_card: Card | null
  srs_update: SRS
  session_progress: number
  session_total: number
}

export interface OverviewStats {
  total_cards: number
  mastered_cards: number
  cards_due_today: number
  total_sessions: number
  total_study_time_secs: number
  current_streak: number
  longest_streak: number
  average_accuracy: number
  total_decks: number
}

export interface HeatmapEntry { date: string; count: number }
export interface DailyCardEntry { date: string; reviewed: number; correct: number }
export interface DeckMastery {
  deck_id: string
  deck_title: string
  new_count: number
  learning_count: number
  review_count: number
  mastered_count: number
  total: number
}

export interface CardReviewOut {
  id: string
  card_id: string
  card_front: string
  quality: number
  time_taken_ms: number
  reviewed_at: string
}

export interface SessionDetail extends SessionOut {
  reviews: CardReviewOut[]
}

// ── Decks ─────────────────────────────────────────────────────────────────

export const getDecks = () => api.get<Deck[]>('/decks').then(r => r.data)
export const getDeck = (id: string) => api.get<Deck>(`/decks/${id}`).then(r => r.data)
export const updateDeck = (id: string, body: Partial<Pick<Deck, 'title' | 'description' | 'tags'>>) =>
  api.patch<Deck>(`/decks/${id}`, body).then(r => r.data)
export const deleteDeck = (id: string) => api.delete(`/decks/${id}`)

// ── Cards ─────────────────────────────────────────────────────────────────

export const getDeckCards = (deckId: string) =>
  api.get<Card[]>(`/decks/${deckId}/cards`).then(r => r.data)
export const getDueCards = (deckId?: string) =>
  api.get<Card[]>('/cards/due', { params: deckId ? { deck_id: deckId } : {} }).then(r => r.data)
export const updateCard = (id: string, body: Partial<Pick<Card, 'front' | 'back' | 'hint' | 'tags'>>) =>
  api.patch<Card>(`/cards/${id}`, body).then(r => r.data)
export const deleteCard = (id: string) => api.delete(`/cards/${id}`)

// ── Upload ────────────────────────────────────────────────────────────────

export const uploadPDF = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post<UploadStatus>('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}
export const getUploadStatus = (jobId: string) =>
  api.get<UploadStatus>(`/upload/${jobId}/status`).then(r => r.data)

// ── Review ────────────────────────────────────────────────────────────────

export const startSession = (deckId?: string) =>
  api.post<{ session_id: string; total_cards: number; first_card: Card }>(
    '/review/start',
    { deck_id: deckId ?? null },
  ).then(r => r.data)

export const submitAnswer = (payload: {
  session_id: string
  card_id: string
  quality: number
  time_taken_ms: number
}) => api.post<ReviewAnswerOut>('/review/answer', payload).then(r => r.data)

export const endSession = (sessionId: string) =>
  api.post<SessionOut>(`/review/end/${sessionId}`).then(r => r.data)

// ── Analytics ─────────────────────────────────────────────────────────────

export const getOverview = () => api.get<OverviewStats>('/analytics/overview').then(r => r.data)
export const getHeatmap = () => api.get<HeatmapEntry[]>('/analytics/heatmap').then(r => r.data)
export const getDailyCards = () => api.get<DailyCardEntry[]>('/analytics/daily-cards').then(r => r.data)
export const getDeckMastery = () => api.get<DeckMastery[]>('/analytics/decks').then(r => r.data)

// ── History ───────────────────────────────────────────────────────────────

export const getHistory = (params?: { deck_id?: string; limit?: number; offset?: number }) =>
  api.get<SessionOut[]>('/history', { params }).then(r => r.data)
export const getSessionDetail = (id: string) =>
  api.get<SessionDetail>(`/history/${id}`).then(r => r.data)
