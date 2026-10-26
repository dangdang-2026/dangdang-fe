export type MealType = 'breakfast' | 'lunch' | 'dinner'

// 측정 시점: 공복 · 식후 · 자기 전
export type MeasureSlot = 'fasting' | 'post-meal' | 'bedtime'

export type Meal = {
  id: string
  type: MealType
  startedAt: string
  // 이번 끼니 식후 측정 건너뜀
  skipped: boolean
}

export type GlucoseRecord = {
  id: string
  slot: MeasureSlot
  value: number
  measuredAt: string
  // 식후 측정이면 연결된 끼니
  mealId?: string
  mealType?: MealType
  // 고친 시각. 리포트에 "수정됨" 표시
  editedAt?: string
  // 처음 입력한 값(수정 전후 기록용)
  original?: { value: number; measuredAt: string }
}

// 입력 시트에 넘기는 측정 시점 정보
export type MeasureTarget = {
  slot: MeasureSlot
  mealId?: string
  mealType?: MealType
  // 식후 측정 예정 시각
  dueAt?: string
}

export type TargetComparison = 'in-range' | 'high' | 'off' | 'invalid'
