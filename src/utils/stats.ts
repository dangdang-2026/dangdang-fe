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

// 예: 8/16~9/14
export const formatShortRange = ({ from, to }: DateRange) =>
  `${from.getMonth() + 1}/${from.getDate()}~${to.getMonth() + 1}/${to.getDate()}`

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
  // 공복: 목표를 한 번도 안 넘은 날 · 목표와 비교한 기록이 있는 날
  inRangeDays: number
  measuredDays: number
  missed: number
  overDays: number
  // 그때 목표와 비교한 기록 수 · 그중 목표 안 · 70 미만 횟수
  judged: number
  inTarget: number
  belowLow: number
  // 식후만: 끼니별 평균
  byMeal: Record<MealType, number | null>
}

// 끝 글자에 받침이 있는지. 숫자는 읽는 소리로(0 영 · 1 일 · 3 삼 · 6 육 · 7 칠 · 8 팔)
function hasBatchim(word: string) {
  const last = word.at(-1) ?? ''
  if (/d/.test(last)) return '013678'.includes(last)
  const code = last.charCodeAt(0) - 0xac00
  return code >= 0 && code <= 11171 && code % 28 !== 0
}

// 예: 지난달과 · 9/14와 · 10/7과
export const withAnd = (word: string) => `${word}${hasBatchim(word) ? '과' : '와'}`

// 비교 문구 종류: 횟수 · 날 수(많아요/적어요), 혈당(높아요/낮아요), 비율(%포인트 늘었어요/줄었어요)
export type CompareKind = 'count' | 'day' | 'glucose' | 'rate'

const COMPARE_WORDS: Record<CompareKind, [string, string]> = {
  count: ['많아요', '적어요'],
  day: ['많아요', '적어요'],
  glucose: ['높아요', '낮아요'],
  rate: ['늘었어요', '줄었어요'],
}

// 예: 지난달보다 7번 많아요 · 지난주엔 없었어요 · 지난달과 같아요. 비교할 값이 없으면 null
export function formatCompare(
  current: number | null,
  before: number | null,
  previousName: string,
  kind: CompareKind,
  unit = '',
) {
  if (current === null || before === null) return null
  if (current === before) return `${withAnd(previousName)} 같아요`
  if (before === 0 && (kind === 'count' || kind === 'day')) return `${previousName}엔 없었어요`
  const [up, down] = COMPARE_WORDS[kind]
  const amount =
    kind === 'rate'
      ? `${Math.abs(current - before)}%포인트`
      : `${Math.abs(current - before)}${unit}`
  return `${previousName}보다 ${amount} ${current > before ? up : down}`
}
