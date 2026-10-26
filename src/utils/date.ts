// 예: 10월 14일 수요일
export function formatMonthDayWeekday(date: Date) {
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })
}
