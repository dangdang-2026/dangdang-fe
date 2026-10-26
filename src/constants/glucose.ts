import type { MealType } from '@/types/glucose'

export const MEAL_LABEL: Record<MealType, string> = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
}

export const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner']

// 입력 가능한 혈당 범위(mg/dL)
export const GLUCOSE_MIN = 20
export const GLUCOSE_MAX = 600
export const GLUCOSE_MAX_DIGITS = 4

const MINUTE = 60 * 1000

// 예정 시각 후 30분까지는 "측정할 시간", 이후는 "시간 지남"
export const MEASURE_WINDOW_MS = 30 * MINUTE
// 예정 시각 3시간 뒤엔 기다리는 측정에서 제외
export const PENDING_EXPIRE_MS = 3 * 60 * MINUTE
// 저장 후 30분간 "저장 직후" 카드 유지
export const JUST_SAVED_MS = 30 * MINUTE
// 예정 시각과 5분 이내면 제시간
export const ON_TIME_MS = 5 * MINUTE
