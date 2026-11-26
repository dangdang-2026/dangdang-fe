import { useEffect } from 'react'
import { syncRange } from '@/stores/useGlucoseStore'
import { addDays, parseDateKey, startOfWeek, toDateKey } from '@/utils/date'

// 보는 주(일~토, 오늘까지)의 혈당 · 식사 · 인슐린을 서버와 맞춤. 주가 바뀔 때마다 다시 받음
export function useWeekRecordsSync(selected: Date, today: Date) {
  const weekStart = startOfWeek(selected)
  const weekEnd = addDays(weekStart, 6)
  const from = toDateKey(weekStart)
  const to = toDateKey(weekEnd < today ? weekEnd : today)

  useEffect(() => {
    const start = parseDateKey(from)
    const end = parseDateKey(to)
    if (!start || !end) return
    // 실패하면 기기 기록 그대로 보여 줌
    syncRange(start, end).catch(() => {})
  }, [from, to])
}
