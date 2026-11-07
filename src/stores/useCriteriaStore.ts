import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { INITIAL_CRITERIA } from '@/mocks/user'
import type { Criteria } from '@/types/criteria'
import { startOfDay } from '@/utils/date'

type CriteriaState = {
  // 오래된 순. 마지막이 지금 기준
  versions: Criteria[]
  addCriteria: (criteria: Omit<Criteria, 'version' | 'appliedFrom'>, now?: Date) => void
  // 첫 진입 설정에서 받은 값으로 1번 기준부터 다시 시작
  startCriteria: (criteria: Omit<Criteria, 'version' | 'appliedFrom'>) => void
}

// 첫 버전은 아주 옛날부터 적용해 이전 기록도 비교되게
const FIRST_APPLIED_FROM = new Date(2000, 0, 1).toISOString()

// API 연동 전까지 기기(localStorage)에 저장
export const useCriteriaStore = create<CriteriaState>()(
  persist(
    (set) => ({
      versions: [{ ...INITIAL_CRITERIA, appliedFrom: FIRST_APPLIED_FROM }],
      addCriteria: (criteria, now = new Date()) =>
        set((state) => {
          const appliedFrom = startOfDay(now).toISOString()
          // 같은 날 다시 바꾸면 그날 버전을 덮어씀
          const sameDay = state.versions.find((item) => item.appliedFrom === appliedFrom)
          const previous = state.versions.filter((item) => item !== sameDay)
          const version = sameDay?.version ?? (state.versions.at(-1)?.version ?? 0) + 1
          return { versions: [...previous, { ...criteria, version, appliedFrom }] }
        }),
      startCriteria: (criteria) =>
        set({ versions: [{ ...criteria, version: 1, appliedFrom: FIRST_APPLIED_FROM }] }),
    }),
    { name: 'dangdang-criteria' },
  ),
)
