import type { PostpartumCheck } from '@/stores/useProfileStore'
import { diffInDays, parseDateKey } from '@/utils/date'

// 고를 수 있는 검사 이름. 그 밖은 직접 적기
export const CHECK_PRESETS = ['산후 혈당 검사', '다음 검진']

export const REMIND_LABEL: Record<PostpartumCheck['remind'][number], string> = {
  eve: '전날 저녁',
  morning: '당일 아침',
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 예: 2026. 12. 2. (수)
export const formatDotDate = (date: Date) =>
  `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}. (${WEEKDAYS[date.getDay()]})`

// 예: 12월 2일 (수)
export const formatMonthDayWeekday = (date: Date) =>
  `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`

// 예: 전날 저녁 · 당일 아침에 알려 드려요
export function formatRemind(remind: PostpartumCheck['remind']) {
  if (remind.length === 0) return '알림은 받지 않아요'
  return `${remind.map((key) => REMIND_LABEL[key]).join(' · ')}에 알려 드려요`
}

// 예: D-44 · D-DAY · D+3
export function formatDday(date: Date, now: Date) {
  const days = diffInDays(now, date)
  if (days === 0) return 'D-DAY'
  return days > 0 ? `D-${days}` : `D+${-days}`
}

// 결과를 아직 안 적은 검사 중 가장 가까운 것
export function getPendingCheck(checks: PostpartumCheck[]) {
  return (
    checks
      .filter((check) => check.memo === null)
      .sort(
        (a, b) => (parseDateKey(a.date)?.getTime() ?? 0) - (parseDateKey(b.date)?.getTime() ?? 0),
      )[0] ?? null
  )
}
