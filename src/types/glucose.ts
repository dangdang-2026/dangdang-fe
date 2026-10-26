export type MealType = 'breakfast' | 'lunch' | 'dinner'

// 측정 시점: 공복 · 식후 · 자기 전
export type MeasureSlot = 'fasting' | 'post-meal' | 'bedtime'

export type Meal = {
  id: string
  type: MealType
  startedAt: string
  // 이번 끼니 식후 측정 건너뜀
  skipped: boolean
  // 먹은 음식 이름과 양. 적기 전엔 없음
  foods?: string[]
  portion?: Portion
}

// 양: 반 · 1 · 1.5
export type Portion = 'half' | 'one' | 'one-half'

// 음식 하나. unit은 양 표시 단위(공기·인분 등)
export type Food = {
  name: string
  unit: string
}

// 사용자가 직접 추가한 음식
export type MyFood = Food & {
  // 영양 참고값 기준으로 쓸 비슷한 음식
  similarTo?: string
  portion: Portion
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
