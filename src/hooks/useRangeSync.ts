import { useEffect } from 'react'
import { RANGE_MAX_DAYS, syncRange } from '@/stores/useGlucoseStore'
import { addDays, parseDateKey, startOfDay, toDateKey } from '@/utils/date'

// from~to(오늘까지) 혈당 · 식사 · 인슐린을 서버와 맞춤. 앱 켤 때는 최근 31일만 받아 리포트처럼 긴 기간은 열 때 받음
export function useRangeSync(from: Date, to: Date) {
  const today = startOfDay(new Date())
  const fromKey = toDateKey(from)
  const toKey = toDateKey(to < today ? to : today)

  useEffect(() => {
    const start = parseDateKey(fromKey)
    const end = parseDateKey(toKey)
    if (!start || !end || start > end) return
    let canceled = false
    void (async () => {
      // 서버 기간 조회 상한(31일)씩 차례로. 실패하면 기기 기록 그대로 보여 줌
      for (let chunk = start; chunk <= end && !canceled; chunk = addDays(chunk, RANGE_MAX_DAYS)) {
        const chunkEnd = addDays(chunk, RANGE_MAX_DAYS - 1)
        await syncRange(chunk, chunkEnd < end ? chunkEnd : end).catch(() => {})
      }
    })()
    return () => {
      canceled = true
    }
  }, [fromKey, toKey])
}
