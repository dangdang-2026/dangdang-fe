import type { GlucoseRecord, Meal } from '@/types/glucose'
import type { Question } from '@/types/visit'

// 오늘(또는 며칠 뒤) 날짜의 시:분
const todayAt = (hours: number, minutes: number, days = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hours, minutes, 0, 0)
  return date
}

// A-05 가이드 투어 예시 기록. 화면에만 쓰고 저장하지 않음
export const TOUR_POST_MEAL_HOURS = 1

// 점심 식사 중 화면 기준 시각(측정까지 38분)
export const TOUR_NOW = todayAt(12, 32)
export const TOUR_DUE_AT = todayAt(13, 10)
export const TOUR_MEASURED_AT = todayAt(13, 12)

export const TOUR_GLUCOSE = { value: 128, target: 140 }

const BREAKFAST: Meal = {
  id: 'tour-breakfast',
  type: 'breakfast',
  startedAt: todayAt(8, 10).toISOString(),
  skipped: false,
  foods: ['현미밥', '계란말이'],
}

export const TOUR_LUNCH: Meal = {
  id: 'tour-lunch',
  type: 'lunch',
  startedAt: todayAt(12, 10).toISOString(),
  skipped: false,
}

const MORNING_RECORDS: GlucoseRecord[] = [
  { id: 'tour-fasting', slot: 'fasting', value: 88, measuredAt: todayAt(7, 40).toISOString() },
  {
    id: 'tour-breakfast-after',
    slot: 'post-meal',
    value: 132,
    measuredAt: todayAt(9, 12).toISOString(),
    mealId: BREAKFAST.id,
    mealType: 'breakfast',
  },
]

export const TOUR_LUNCH_RECORD: GlucoseRecord = {
  id: 'tour-lunch-after',
  slot: 'post-meal',
  value: 138,
  measuredAt: TOUR_MEASURED_AT.toISOString(),
  mealId: TOUR_LUNCH.id,
  mealType: 'lunch',
}

// 식사 전: 점심까지 기록을 마치고 저녁을 기다림
export const TOUR_BEFORE_MEAL = {
  meals: [BREAKFAST, TOUR_LUNCH],
  records: [...MORNING_RECORDS, TOUR_LUNCH_RECORD],
}

// 식사 중: 점심 식후 측정을 기다림
export const TOUR_EATING = {
  meals: [BREAKFAST, TOUR_LUNCH],
  records: MORNING_RECORDS,
}

export const TOUR_VISIT_DAYS = 5
export const TOUR_VISIT_AT = todayAt(10, 30, TOUR_VISIT_DAYS)

export const TOUR_QUESTIONS: Question[] = [
  {
    id: 'tour-question-1',
    text: '저녁 식후 수치가 계속 높으면 어떻게 하나요?',
    createdAt: todayAt(9, 0).toISOString(),
  },
  {
    id: 'tour-question-2',
    text: '식후 측정은 지금처럼 1시간 뒤에 하나요?',
    createdAt: todayAt(9, 0).toISOString(),
  },
]
