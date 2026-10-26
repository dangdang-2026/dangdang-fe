import type { Criteria } from '@/types/criteria'

// API 연동 전 임시 사용자 정보
export const MOCK_USER = {
  name: '지수',
  // 병원에서 들은 식후 측정 시점(시간). 모르면 null
  postMealHours: 1,
  // 병원에서 들은 목표(mg/dL 미만). 비우면 비교 안 함
  targets: {
    fasting: 95 as number | null,
    postMeal: 140 as number | null,
  },
}

// 가입(온보딩) 연동 전 첫 기준. 기준을 바꾸면 이 위에 새 버전이 쌓임
export const INITIAL_CRITERIA: Omit<Criteria, 'appliedFrom'> = {
  version: 1,
  source: '가입 전 임시 기준',
  postMealHours: 1,
  measureSlots: ['fasting', 'breakfast', 'lunch', 'dinner'],
  targets: { fasting: 95, postMeal: 140 },
}
