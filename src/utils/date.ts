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

export function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}
