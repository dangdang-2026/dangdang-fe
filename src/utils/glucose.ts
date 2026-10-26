import {
  GLUCOSE_MAX,
  GLUCOSE_MIN,
  JUST_SAVED_MS,
  MEAL_LABEL,
  MEAL_ORDER,
  MEASURE_WINDOW_MS,
  PENDING_EXPIRE_MS,
} from '@/constants/glucose'
import type {
  GlucoseRecord,
  Meal,
  MealType,
  MeasureSlot,
  MeasureTarget,
  TargetComparison,
} from '@/types/glucose'
import { isSameDay } from '@/utils/date'

const HOUR = 60 * 60 * 1000

export type Targets = {
  fasting: number | null
  postMeal: number | null
}

// 10시 전 아침, 16시 전 점심, 이후 저녁
export function getMealTypeByHour(now: Date): MealType {
  const hour = now.getHours()
  if (hour < 10) return 'breakfast'
  if (hour < 16) return 'lunch'
  return 'dinner'
}

// 지금 시간대 이후 끼니 중 오늘 아직 시작 안 한 첫 끼니
export function getNextMealType(meals: Meal[], now: Date): MealType {
  const startedToday = meals
    .filter((meal) => isSameDay(new Date(meal.startedAt), now))
    .map((meal) => meal.type)
  const fromIndex = MEAL_ORDER.indexOf(getMealTypeByHour(now))
  const next = MEAL_ORDER.slice(fromIndex).find((type) => !startedToday.includes(type))
  return next ?? 'dinner'
}

export function getSlotLabel(
  slot: MeasureSlot,
  mealType: MealType | undefined,
  hours: number | null,
) {
  if (slot === 'fasting') return '공복'
  if (slot === 'bedtime') return '자기 전'
  const meal = mealType ? `${MEAL_LABEL[mealType]} ` : ''
  return hours ? `${meal}식후 ${hours}시간` : `${meal}식후`
}

export function getDueAt(meal: Meal, hours: number) {
  return new Date(new Date(meal.startedAt).getTime() + hours * HOUR)
}

// 식후 측정을 기다리는 끼니(건너뜀·기록함·만료 제외)
export function getPendingMeal(
  meals: Meal[],
  records: GlucoseRecord[],
  hours: number | null,
  now: Date,
) {
  if (!hours) return null
  const meal = meals.at(-1)
  if (!meal || meal.skipped) return null
  if (records.some((record) => record.mealId === meal.id)) return null

  const dueAt = getDueAt(meal, hours)
  if (now.getTime() - dueAt.getTime() > PENDING_EXPIRE_MS) return null
  return { meal, dueAt }
}

// 입력 시트를 열 때 측정 시점 결정
export function getMeasureTarget(
  meals: Meal[],
  records: GlucoseRecord[],
  hours: number | null,
  now: Date,
): MeasureTarget {
  const pending = getPendingMeal(meals, records, hours, now)
  if (pending) {
    return {
      slot: 'post-meal',
      mealId: pending.meal.id,
      mealType: pending.meal.type,
      dueAt: pending.dueAt.toISOString(),
    }
  }

  const hasFastingToday = records.some(
    (record) => record.slot === 'fasting' && isSameDay(new Date(record.measuredAt), now),
  )
  if (!hasFastingToday && now.getHours() < 11) return { slot: 'fasting' }
  if (now.getHours() >= 21) return { slot: 'bedtime' }
  return { slot: 'post-meal', mealType: getMealTypeByHour(now) }
}

export function isValidGlucose(value: number) {
  return value >= GLUCOSE_MIN && value <= GLUCOSE_MAX
}

export function getTarget(slot: MeasureSlot, targets: Targets, hours: number | null) {
  if (slot === 'fasting') return targets.fasting
  // 식후 측정 시점을 모르면 목표 비교 끔(R1)
  if (slot === 'post-meal' && hours) return targets.postMeal
  return null
}

export function compareToTarget(value: number, target: number | null): TargetComparison {
  if (!isValidGlucose(value)) return 'invalid'
  if (target === null) return 'off'
  return value < target ? 'in-range' : 'high'
}

export type HeroState =
  | { kind: 'first-day' }
  | { kind: 'before-meal'; nextMeal: MealType; lastRecord?: GlucoseRecord }
  | { kind: 'eating' | 'measure-time' | 'overdue'; meal: Meal; dueAt: Date }
  | { kind: 'saved'; record: GlucoseRecord; nextMeal: MealType }

// 히어로 카드 상태 우선순위: 측정 대기 > 저장 직후 > 식사 전 > 첫날
export function getHeroState(
  meals: Meal[],
  records: GlucoseRecord[],
  hours: number | null,
  now: Date,
): HeroState {
  const pending = getPendingMeal(meals, records, hours, now)
  if (pending) {
    const diff = now.getTime() - pending.dueAt.getTime()
    const kind = diff < 0 ? 'eating' : diff < MEASURE_WINDOW_MS ? 'measure-time' : 'overdue'
    return { kind, ...pending }
  }

  const nextMeal = getNextMealType(meals, now)
  const lastRecord = records.at(-1)
  if (lastRecord && now.getTime() - new Date(lastRecord.measuredAt).getTime() < JUST_SAVED_MS) {
    return { kind: 'saved', record: lastRecord, nextMeal }
  }

  if (meals.length === 0 && records.length === 0) return { kind: 'first-day' }

  const lastRecordToday =
    lastRecord && isSameDay(new Date(lastRecord.measuredAt), now) ? lastRecord : undefined
  return { kind: 'before-meal', nextMeal, lastRecord: lastRecordToday }
}
