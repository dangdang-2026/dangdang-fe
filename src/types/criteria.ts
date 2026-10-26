import type { Targets } from '@/utils/glucose'

// 병원에서 재라고 한 때
export type MeasureSlotKey = 'fasting' | 'breakfast' | 'lunch' | 'dinner' | 'bedtime'

// 병원 기준 한 버전. 바꿀 때마다 새 버전을 쌓고 지난 기록은 그때 버전으로 봄
export type Criteria = {
  version: number
  // 이 날짜(0시)부터 적용
  appliedFrom: string
  // 예: 진료 후 직접 입력
  source: string
  // 식후 측정 시점(시간). 모르면 null
  postMealHours: number | null
  measureSlots: MeasureSlotKey[]
  // 목표(mg/dL 미만). 비우면 비교 안 함
  targets: Targets
}
