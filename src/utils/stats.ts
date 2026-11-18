import type { MealType } from '@/types/glucose'
import { addDays, diffInDays } from '@/utils/date'

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

export type DayPoint = { date: Date; value: number | null; count: number }

// 서버 통계를 화면용으로 바꾼 값
export type PeriodStats = {
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

// 예: ▼ 6 · ▲ 8%p. 같으면 null
export function formatDelta(current: number | null, previous: number | null, unit = '') {
  if (current === null || previous === null || current === previous) return null
  return `${current < previous ? '▼' : '▲'} ${Math.abs(current - previous)}${unit}`
}
