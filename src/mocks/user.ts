import type { Criteria } from '@/types/criteria'

// 첫 진입 설정 전 자리 채움. 목표는 병원에서 들은 값만 쓰므로 비워 둠
export const INITIAL_CRITERIA: Omit<Criteria, 'appliedFrom'> = {
  version: 1,
  source: '첫 진입 설정 전',
  postMealHours: 1,
  measureSlots: ['fasting', 'breakfast', 'lunch', 'dinner'],
  targets: { fasting: null, postMeal: null },
}
