import type { Criteria } from '@/types/criteria'

// 가입(온보딩) 연동 전 임시 사용자 정보. 내 정보에서 바꾸면 프로필에 저장
export const MOCK_USER = {
  name: '지수',
}

// 첫 진입 설정 전 자리 채움. 목표는 병원에서 들은 값만 쓰므로 비워 둠
export const INITIAL_CRITERIA: Omit<Criteria, 'appliedFrom'> = {
  version: 1,
  source: '첫 진입 설정 전',
  postMealHours: 1,
  measureSlots: ['fasting', 'breakfast', 'lunch', 'dinner'],
  targets: { fasting: null, postMeal: null },
}
