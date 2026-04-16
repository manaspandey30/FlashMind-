import { create } from 'zustand'
import type { Card } from '../api/client'

interface ReviewState {
  sessionId: string | null
  currentCard: Card | null
  totalCards: number
  progress: number
  isFlipped: boolean
  cardStartTime: number
  setSession: (id: string, total: number, first: Card) => void
  setCurrentCard: (card: Card | null, progress: number, total: number) => void
  flip: () => void
  resetFlip: () => void
  clear: () => void
}

export const useReviewStore = create<ReviewState>((set) => ({
  sessionId: null,
  currentCard: null,
  totalCards: 0,
  progress: 0,
  isFlipped: false,
  cardStartTime: Date.now(),

  setSession: (id, total, first) =>
    set({ sessionId: id, totalCards: total, currentCard: first, progress: 0, isFlipped: false, cardStartTime: Date.now() }),

  setCurrentCard: (card, progress, total) =>
    set({ currentCard: card, progress, totalCards: total, isFlipped: false, cardStartTime: Date.now() }),

  flip: () => set({ isFlipped: true }),
  resetFlip: () => set({ isFlipped: false }),
  clear: () => set({ sessionId: null, currentCard: null, totalCards: 0, progress: 0, isFlipped: false }),
}))
