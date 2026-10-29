import { MEAL_ORDER } from '@/constants/glucose'
import type { Criteria } from '@/types/criteria'
import type { GlucoseRecord, Meal, MealType } from '@/types/glucose'
import { getCriteriaAt } from '@/utils/criteria'
import { addDays, diffInDays, isSameDay, startOfDay } from '@/utils/date'
import { compareToTarget, getDueAt } from '@/utils/glucose'

export type StatsSlot = 'fasting' | 'post-meal'
export type StatsPeriod = '1w' | '2w' | '1m' | '3m' | 'custom'

export const PERIOD_DAYS: Record<Exclude<StatsPeriod, 'custom'>, number> = {
  '1w': 7,
  '2w': 14,
  '1m': 30,
  '3m': 90,
}

export const PERIOD_LABEL: Record<StatsPeriod, string> = {
  '1w': '1주',
  '2w': '2주',
  '1m': '1개월',
  '3m': '3개월',
  custom: '직접',
}

// 이번 · 지난 기간 이름. 예: 이번 달 · 지난달
export const PERIOD_NAMES: Record<StatsPeriod, { current: string; previous: string }> = {
  '1w': { current: '이번 주', previous: '지난주' },
  '2w': { current: '최근 2주', previous: '그 전 2주' },
  '1m': { current: '이번 달', previous: '지난달' },
  '3m': { current: '최근 3개월', previous: '그 전 3개월' },
  custom: { current: '고른 기간', previous: '그 전 기간' },
}

export type DateRange = { from: Date; to: Date }

// 예: 9/29–10/28
export const formatShortRange = ({ from, to }: DateRange) =>
  `${from.getMonth() + 1}/${from.getDate()}–${to.getMonth() + 1}/${to.getDate()}`

// 예: 10월 1일 – 14일 / 10월 28일 – 11월 3일
export function formatRangeLabel({ from, to }: DateRange) {
  const start = `${from.getMonth() + 1}월 ${from.getDate()}일`
  const end =
    from.getMonth() === to.getMonth()
      ? `${to.getDate()}일`
      : `${to.getMonth() + 1}월 ${to.getDate()}일`
  return `${start} – ${end}`
}

// 바로 전 같은 길이 기간
export function getPreviousRange({ from, to }: DateRange): DateRange {
  const length = diffInDays(from, to) + 1
  return { from: addDays(from, -length), to: addDays(from, -1) }
}

const inRange = (date: Date, { from, to }: DateRange) =>
  date >= startOfDay(from) && date < addDays(to, 1)

const average = (values: number[]) =>
  values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null

// 그 기록 날짜에 적용되던 목표. 기준이 바뀐 날부터 새 기준으로 셈
function targetAt(record: GlucoseRecord, versions: Criteria[]) {
  const { targets, postMealHours } = getCriteriaAt(versions, new Date(record.measuredAt))
  if (record.slot === 'fasting') return targets.fasting
  return postMealHours ? targets.postMeal : null
}

export type DayPoint = { date: Date; value: number | null; count: number }

export type PeriodStats = {
  range: DateRange
  days: DayPoint[]
  average: number | null
  count: number
  // 목표가 있는 기록 중 목표 미만 비율(%) · 공복은 목표 미만인 날 수
  inRangeRate: number | null
  inRangeDays: number
  measuredDays: number
  missed: number
  overDays: number
  // 식후만: 끼니별 평균
  byMeal: Record<MealType, number | null>
}

export function getPeriodStats(
  slot: StatsSlot,
  range: DateRange,
  records: GlucoseRecord[],
  meals: Meal[],
  versions: Criteria[],
  now: Date,
): PeriodStats {
  const slotRecords = records.filter(
    (record) => record.slot === slot && inRange(new Date(record.measuredAt), range),
  )
  const length = diffInDays(range.from, range.to) + 1
  const days = Array.from({ length }, (_, index) => {
    const date = addDays(range.from, index)
    const values = slotRecords
      .filter((record) => isSameDay(new Date(record.measuredAt), date))
      .map((record) => record.value)
    return { date, value: average(values), count: values.length }
  })

  const compared = slotRecords
    .map((record) => ({ record, target: targetAt(record, versions) }))
    .filter((item) => item.target !== null)
  const inRangeCount = compared.filter(
    ({ record, target }) => compareToTarget(record.value, target) === 'in-range',
  ).length
  const overDates = new Set(
    compared
      .filter(({ record, target }) => compareToTarget(record.value, target) === 'high')
      .map(({ record }) => startOfDay(new Date(record.measuredAt)).getTime()),
  )
  const measuredDays = days.filter((day) => day.count > 0)
  const inRangeDays = measuredDays.filter((day) =>
    slotRecords
      .filter((record) => isSameDay(new Date(record.measuredAt), day.date))
      .every((record) => compareToTarget(record.value, targetAt(record, versions)) !== 'high'),
  ).length

  // 식후: 식사 시작 뒤 측정 시간이 지났는데 기록이 없는 끼니
  // 공복: 다른 기록은 있는데 공복만 빠진 날
  const missed =
    slot === 'post-meal'
      ? meals.filter((meal) => {
          if (meal.skipped || !inRange(new Date(meal.startedAt), range)) return false
          const { postMealHours } = getCriteriaAt(versions, new Date(meal.startedAt))
          if (!postMealHours || getDueAt(meal, postMealHours) > now) return false
          return !records.some((record) => record.mealId === meal.id)
        }).length
      : days.filter(
          (day) =>
            day.count === 0 &&
            records.some((record) => isSameDay(new Date(record.measuredAt), day.date)),
        ).length

  const byMeal = Object.fromEntries(
    MEAL_ORDER.map((type) => [
      type,
      average(slotRecords.filter((record) => record.mealType === type).map((r) => r.value)),
    ]),
  ) as Record<MealType, number | null>

  return {
    range,
    days,
    average: average(slotRecords.map((record) => record.value)),
    count: slotRecords.length,
    inRangeRate: compared.length ? Math.round((inRangeCount / compared.length) * 100) : null,
    inRangeDays,
    measuredDays: measuredDays.length,
    missed,
    overDays: overDates.size,
    byMeal,
  }
}

// 예: ▼ 6 · ▲ 8%p. 같으면 null
export function formatDelta(current: number | null, previous: number | null, unit = '') {
  if (current === null || previous === null || current === previous) return null
  return `${current < previous ? '▼' : '▲'} ${Math.abs(current - previous)}${unit}`
}
