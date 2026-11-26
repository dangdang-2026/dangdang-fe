import {
  DAY_END_HOUR,
  GLUCOSE_MAX,
  GLUCOSE_MIN,
  JUST_SAVED_MS,
  MEAL_LABEL,
  MEAL_ORDER,
  MEASURE_WINDOW_MS,
  ON_TIME_MS,
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
import type { MeasureSlotKey } from '@/types/criteria'
import { formatDuration, MEASURE_SLOT_ORDER } from '@/utils/criteria'
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
  return hours ? `${meal}식후 ${formatDuration(hours)}` : `${meal}식후`
}

export function getDueAt(meal: Meal, hours: number) {
  return new Date(new Date(meal.startedAt).getTime() + hours * HOUR)
}

// 병원 기준에서 이 끼니 식후를 재는지. 비워 뒀으면(아직 모름) 시작한 끼니는 다 잼
export const measuresAfter = (type: MealType, slots: MeasureSlotKey[]) =>
  slots.length === 0 || slots.includes(type)

// 식후 측정을 기다리는 끼니(건너뜀·기록함·만료 · 병원 기준에 없는 끼니 제외)
export function getPendingMeal(
  meals: Meal[],
  records: GlucoseRecord[],
  hours: number | null,
  now: Date,
  slots: MeasureSlotKey[] = MEASURE_SLOT_ORDER,
) {
  if (!hours) return null
  const meal = meals.at(-1)
  if (!meal || meal.skipped || !measuresAfter(meal.type, slots)) return null
  if (records.some((record) => record.mealId === meal.id)) return null

  const dueAt = getDueAt(meal, hours)
  if (now.getTime() - dueAt.getTime() > PENDING_EXPIRE_MS) return null
  return { meal, dueAt }
}

// 측정 시점을 모를 때 식사 중인 끼니. 혈당을 적거나 3시간 지나면 끝
export function getOpenMeal(
  meals: Meal[],
  records: GlucoseRecord[],
  now: Date,
  slots: MeasureSlotKey[] = MEASURE_SLOT_ORDER,
) {
  const meal = meals.at(-1)
  if (!meal || meal.skipped || !measuresAfter(meal.type, slots)) return null
  if (records.some((record) => record.mealId === meal.id)) return null
  if (now.getTime() - new Date(meal.startedAt).getTime() > PENDING_EXPIRE_MS) return null
  return meal
}

// 병원 기준에 없는 끼니를 먹는 중. 혈당을 적거나 3시간 지나면 끝
function getFreeMeal(meals: Meal[], records: GlucoseRecord[], now: Date, slots: MeasureSlotKey[]) {
  const meal = meals.at(-1)
  if (!meal || meal.skipped || measuresAfter(meal.type, slots)) return null
  const startedAt = new Date(meal.startedAt)
  if (now.getTime() - startedAt.getTime() > PENDING_EXPIRE_MS) return null
  // 끼니 연결 없이 적은 혈당도 식사 뒤면 적은 것으로 봄
  const recorded = records.some(
    (record) => record.mealId === meal.id || new Date(record.measuredAt) >= startedAt,
  )
  return recorded ? null : meal
}

// 입력 시트를 열 때 측정 시점 결정
export function getMeasureTarget(
  meals: Meal[],
  records: GlucoseRecord[],
  hours: number | null,
  now: Date,
  slots: MeasureSlotKey[] = MEASURE_SLOT_ORDER,
): MeasureTarget {
  const pending = getPendingMeal(meals, records, hours, now, slots)
  const openMeal = hours ? null : getOpenMeal(meals, records, now, slots)
  if (openMeal) return { slot: 'post-meal', mealId: openMeal.id, mealType: openMeal.type }
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
  // 공복 · 자기 전은 병원 기준에 있을 때만
  if (slots.includes('fasting') && !hasFastingToday && now.getHours() < 11) {
    return { slot: 'fasting' }
  }
  if (slots.includes('bedtime') && now.getHours() >= 21) return { slot: 'bedtime' }
  return { slot: 'post-meal', mealType: getSlotMealType(now, slots) }
}

// 지금 시간대 끼니. 병원 기준에 없으면 그 앞(없으면 처음) 기준 끼니로
function getSlotMealType(now: Date, slots: MeasureSlotKey[]): MealType {
  const byHour = getMealTypeByHour(now)
  const measured = MEAL_ORDER.filter((type) => measuresAfter(type, slots))
  if (measured.length === 0 || measured.includes(byHour)) return byHour
  const before = measured.filter((type) => MEAL_ORDER.indexOf(type) < MEAL_ORDER.indexOf(byHour))
  return before.at(-1) ?? measured[0]
}

// 지난 날 나중에 채우기: 그날 공복이 없으면 공복부터
export function getBackfillTarget(records: GlucoseRecord[], at: Date): MeasureTarget {
  const hasFasting = records.some(
    (record) => record.slot === 'fasting' && isSameDay(new Date(record.measuredAt), at),
  )
  if (!hasFasting) return { slot: 'fasting' }
  return { slot: 'post-meal', mealType: getMealTypeByHour(at) }
}

// 식후 측정 예정 시각보다 늦게 잰 분. 제시간이면 0
// 서버가 재야 할 시각을 판정했으면(timing) 그 값으로, 못 받은 기록만 기기 기준으로 계산
export function getLateMinutes(record: GlucoseRecord, meals: Meal[], hours: number | null) {
  if (record.timing !== undefined) {
    if (record.timing !== 'LATE' || !record.expectedAt) return 0
    return Math.round(
      (new Date(record.measuredAt).getTime() - new Date(record.expectedAt).getTime()) / 60000,
    )
  }
  const meal = meals.find((item) => item.id === record.mealId)
  if (!meal || !hours) return 0
  const diff = new Date(record.measuredAt).getTime() - getDueAt(meal, hours).getTime()
  return diff > ON_TIME_MS ? Math.round(diff / 60000) : 0
}

// 화면에 보일 혈당. 혈당계 HI · LO면 숫자 대신 그 글자
export function formatGlucose(record: Pick<GlucoseRecord, 'value' | 'meterLimit'>) {
  return record.meterLimit ?? String(record.value)
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

// 목표보다 높은지. 서버 판정(aboveTarget)이 있으면 그 값, 서버가 목표 없음(null)이면 false, 못 받았으면 기준으로 계산
export function isAboveTarget(record: GlucoseRecord, goal: number | null) {
  if (record.aboveTarget !== undefined) return record.aboveTarget === true
  return compareToTarget(record.value, goal) === 'high'
}

export function compareToTarget(value: number, target: number | null): TargetComparison {
  if (!isValidGlucose(value)) return 'invalid'
  if (target === null) return 'off'
  return value < target ? 'in-range' : 'high'
}

export type HeroState =
  | { kind: 'first-day' }
  | { kind: 'day-end'; meal: Meal; dueAt: Date }
  | { kind: 'before-meal'; nextMeal: MealType; lastRecord?: GlucoseRecord }
  | { kind: 'eating' | 'measure-time' | 'overdue'; meal: Meal; dueAt: Date }
  // 측정 시점을 몰라 남은 시간 없이 식사 중만
  | { kind: 'eating-open'; meal: Meal }
  // 병원 기준에 없는 끼니를 먹는 중. 식후 측정 없음
  | { kind: 'eating-free'; meal: Meal }
  | { kind: 'saved'; record: GlucoseRecord; nextMeal: MealType }
  // 병원 기준에 있는 측정을 오늘 다 함
  | { kind: 'all-done'; count: number }

// 오늘 식후 측정을 놓친 끼니(건너뜀·기록함 · 병원 기준에 없는 끼니 제외, 측정할 시간이 지남)
export function getMissedMeals(
  meals: Meal[],
  records: GlucoseRecord[],
  hours: number | null,
  now: Date,
  slots: MeasureSlotKey[] = MEASURE_SLOT_ORDER,
) {
  if (!hours) return []
  return meals
    .filter((meal) => isSameDay(new Date(meal.startedAt), now) && !meal.skipped)
    .filter((meal) => measuresAfter(meal.type, slots))
    .filter((meal) => !records.some((record) => record.mealId === meal.id))
    .map((meal) => ({ meal, dueAt: getDueAt(meal, hours) }))
    .filter(({ dueAt }) => now.getTime() - dueAt.getTime() >= MEASURE_WINDOW_MS)
}

// 오늘 병원 기준 측정을 다 했으면 기록한 수. 남았으면 null. 건너뛴 끼니는 한 것으로 봄
export function getAllDoneCount(
  meals: Meal[],
  records: GlucoseRecord[],
  now: Date,
  slots: MeasureSlotKey[],
) {
  if (slots.length === 0) return null
  const today = records.filter((record) => isSameDay(new Date(record.measuredAt), now))
  const skipped = meals.filter((meal) => meal.skipped && isSameDay(new Date(meal.startedAt), now))
  let count = 0
  for (const slot of slots) {
    const done =
      slot === 'fasting' || slot === 'bedtime'
        ? today.some((record) => record.slot === slot)
        : today.some((record) => record.slot === 'post-meal' && record.mealType === slot)
    if (done) count += 1
    else if (!skipped.some((meal) => meal.type === slot)) return null
  }
  return count > 0 ? count : null
}

// 저녁 이후(21시~)인지. 놓친 측정은 빨강 없이 나중에 채우기
export function isDayEnd(now: Date) {
  return now.getHours() >= DAY_END_HOUR
}

// 히어로 카드 상태 우선순위: 측정 대기 > 저장 직후 > 모두 완료 > 하루 정리 > 식사 전 > 첫날
export function getHeroState(
  meals: Meal[],
  records: GlucoseRecord[],
  hours: number | null,
  now: Date,
  slots: MeasureSlotKey[] = MEASURE_SLOT_ORDER,
): HeroState {
  const pending = getPendingMeal(meals, records, hours, now, slots)
  const missed = isDayEnd(now) ? getMissedMeals(meals, records, hours, now, slots) : []
  if (pending) {
    const diff = now.getTime() - pending.dueAt.getTime()
    const kind = diff < 0 ? 'eating' : diff < MEASURE_WINDOW_MS ? 'measure-time' : 'overdue'
    // 저녁 이후엔 시간 지남 대신 하루 정리
    if (!(kind === 'overdue' && missed.length > 0)) return { kind, ...pending }
  }
  const openMeal = hours ? null : getOpenMeal(meals, records, now, slots)
  if (openMeal) return { kind: 'eating-open', meal: openMeal }
  const freeMeal = getFreeMeal(meals, records, now, slots)
  if (freeMeal) return { kind: 'eating-free', meal: freeMeal }

  const nextMeal = getNextMealType(meals, now)
  const lastRecord = records.at(-1)
  if (lastRecord && now.getTime() - new Date(lastRecord.measuredAt).getTime() < JUST_SAVED_MS) {
    return { kind: 'saved', record: lastRecord, nextMeal }
  }

  // 모두 완료는 저녁 이후거나 세 끼를 다 시작했을 때만. 남은 식사를 시작할 수 있게
  const allMealsStarted = MEAL_ORDER.every((type) =>
    meals.some((meal) => meal.type === type && isSameDay(new Date(meal.startedAt), now)),
  )
  const doneCount = getAllDoneCount(meals, records, now, slots)
  const noMissed = getMissedMeals(meals, records, hours, now, slots).length === 0
  if (doneCount !== null && noMissed && (isDayEnd(now) || allMealsStarted)) {
    return { kind: 'all-done', count: doneCount }
  }
  if (missed.length > 0) return { kind: 'day-end', ...missed[missed.length - 1] }
  if (meals.length === 0 && records.length === 0) return { kind: 'first-day' }

  const lastRecordToday =
    lastRecord && isSameDay(new Date(lastRecord.measuredAt), now) ? lastRecord : undefined
  return { kind: 'before-meal', nextMeal, lastRecord: lastRecordToday }
}
