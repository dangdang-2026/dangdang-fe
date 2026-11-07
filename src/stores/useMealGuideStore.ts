import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 영양 상담에서 받은 식사 안내. 받은 표현 그대로, 앱은 실제 식사와 비교하지 않음
export type MealGuide = {
  // YYYY-MM-DD
  receivedOn: string
  place: string
  meals: string
  snacks: string
  // 받은 식단표 사진 1장(줄인 data URL). 기기에만 저장
  photo?: string
  createdAt: string
  // 고친 날짜. 처음 저장이면 없음
  updatedAt?: string
}

type MealGuideInput = Omit<MealGuide, 'createdAt' | 'updatedAt'>

type MealGuideState = {
  guide: MealGuide | null
  saveGuide: (input: MealGuideInput, now?: Date) => void
}

// API 연동 전까지 기기에 저장
export const useMealGuideStore = create<MealGuideState>()(
  persist(
    (set) => ({
      guide: null,
      saveGuide: (input, now = new Date()) =>
        set((state) => ({
          guide: state.guide
            ? { ...input, createdAt: state.guide.createdAt, updatedAt: now.toISOString() }
            : { ...input, createdAt: now.toISOString() },
        })),
    }),
    { name: 'dangdang-meal-guide' },
  ),
)
