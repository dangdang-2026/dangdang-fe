import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Question } from '@/types/visit'

type VisitState = {
  // 다음 진료 일시. 모르면 null
  nextVisitAt: string | null
  // 진료 탭 첫 진입에 다음 진료일을 물어봤는지
  asked: boolean
  questions: Question[]
  // 진료 후 메모. 나갔다 와도 이어 쓰게 남겨 둠
  note: string
  setNextVisit: (at: string | null) => void
  setNote: (note: string) => void
  addQuestion: (text: string, now?: Date) => void
  removeQuestion: (id: string) => void
  // 지운 질문을 원래 자리에 되돌림
  restoreQuestion: (question: Question, index: number) => void
}

// API 연동 전까지 기기(localStorage)에 저장
export const useVisitStore = create<VisitState>()(
  persist(
    (set) => ({
      nextVisitAt: null,
      asked: false,
      questions: [],
      note: '',
      setNextVisit: (at) => set({ nextVisitAt: at, asked: true }),
      setNote: (note) => set({ note }),
      addQuestion: (text, now = new Date()) =>
        set((state) => ({
          questions: [
            ...state.questions,
            { id: crypto.randomUUID(), text, createdAt: now.toISOString() },
          ],
        })),
      removeQuestion: (id) =>
        set((state) => ({ questions: state.questions.filter((item) => item.id !== id) })),
      restoreQuestion: (question, index) =>
        set((state) => {
          const questions = [...state.questions]
          questions.splice(index, 0, question)
          return { questions }
        }),
    }),
    { name: 'dangdang-visit' },
  ),
)
