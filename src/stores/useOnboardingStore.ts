import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MeasureSlotKey } from '@/types/criteria'

export type AgreementKey = 'age' | 'terms' | 'privacy' | 'sensitive' | 'marketing'

export const REQUIRED_AGREEMENTS: AgreementKey[] = ['age', 'terms', 'privacy', 'sensitive']

// 단계 사이에 들고 다니는 답. 마치면 프로필·병원 기준으로 옮김
export type OnboardingAnswers = {
  agreements: AgreementKey[]
  // 식후 측정 시점. 아직 모르면 null, 안 고르면 undefined
  postMealHours: number | null | undefined
  measureSlots: MeasureSlotKey[]
  // YYYY-MM-DD. 나중에 적으면 null
  dueDate: string | null
}

type OnboardingState = OnboardingAnswers & {
  // 첫 진입 설정을 마쳤는지. 안 마쳤으면 앱을 열 때 온보딩으로
  completed: boolean
  setAnswers: (changes: Partial<OnboardingAnswers>) => void
  complete: () => void
}

// 서버 가입 연동 전까지 기기에 저장
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      completed: false,
      agreements: [],
      postMealHours: undefined,
      measureSlots: [],
      dueDate: null,
      setAnswers: (changes) => set(changes),
      complete: () => set({ completed: true }),
    }),
    {
      name: 'dangdang-onboarding',
      version: 1,
      // v0은 1시간·4끼가 미리 골라져 저장됐으므로 안 마친 답은 비움
      migrate: (persisted, version) => {
        const state = persisted as OnboardingState
        if (version === 0 && !state.completed) {
          return { ...state, postMealHours: undefined, measureSlots: [] }
        }
        return state
      },
    },
  ),
)
