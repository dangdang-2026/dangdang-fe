// 예: 10월 14일 수요일
export function formatMonthDayWeekday(date: Date) {
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })
}

// 예: 13:10
export function formatTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// 예: 오전 10:30 / 오후 2:05
export function formatMeridiemTime(date: Date) {
  const hours = date.getHours()
  const meridiem = hours < 12 ? '오전' : '오후'
  const hour12 = hours % 12 || 12
  return `${meridiem} ${hour12}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 두 날짜 사이 날 수(시각 무시)
export function diffInDays(from: Date, to: Date) {
  const DAY = 24 * 60 * 60 * 1000
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY)
}

// 예: 10월 14일
export function formatMonthDay(date: Date) {
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

export function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

// 일요일 시작 주
export function startOfWeek(date: Date) {
  return addDays(startOfDay(date), -date.getDay())
}

const WEEK_ORDINALS = ['첫째', '둘째', '셋째', '넷째', '다섯째']

// 주의 일요일이 속한 달 기준. 예: 10월 둘째 주
export function formatWeekLabel(weekStart: Date) {
  const ordinal = WEEK_ORDINALS[Math.ceil(weekStart.getDate() / 7) - 1]
  return `${weekStart.getMonth() + 1}월 ${ordinal} 주`
}

// URL 쿼리용 날짜 키. 예: 2026-10-14
export function toDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function parseDateKey(key: string | null) {
  const match = key?.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}
