import { diffInDays, parseDateKey } from '@/utils/date'

// 출산예정일은 임신 40주(280일) 기준
const FULL_TERM_DAYS = 280

// 출산예정일로 계산한 임신 주수. 예정일이 없으면 null
export function getPregnancyAge(dueDate: string | null, date: Date) {
  const due = parseDateKey(dueDate)
  if (!due) return null
  const daysToDue = diffInDays(date, due)
  const elapsed = FULL_TERM_DAYS - daysToDue
  if (elapsed < 0) return null
  return { weeks: Math.floor(elapsed / 7), days: elapsed % 7, daysToDue }
}

// 예: 임신 26주 3일
export function formatPregnancyAge(dueDate: string | null, date: Date) {
  const age = getPregnancyAge(dueDate, date)
  return age ? `임신 ${age.weeks}주 ${age.days}일` : null
}

// 예: 임신 24~26주 (같은 주면 임신 24주)
export function formatPregnancyRange(dueDate: string | null, from: Date, to: Date) {
  const start = getPregnancyAge(dueDate, from)
  const end = getPregnancyAge(dueDate, to)
  if (!start || !end) return null
  return start.weeks === end.weeks ? `임신 ${start.weeks}주` : `임신 ${start.weeks}~${end.weeks}주`
}
