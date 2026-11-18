import { useEffect, useState } from 'react'
import { getReadingStats } from '@/api/readings'
import { parseDateKey, toDateKey } from '@/utils/date'
import type { DateRange, PeriodStats, StatsSlot } from '@/utils/stats'

type StatsResult = { current: PeriodStats; previous: PeriodStats | null }

// 공복·식후, 기간이 바뀔 때마다 서버 통계를 받음. 다른 조건의 이전 결과는 보여 주지 않음
export function useReadingStats(slot: StatsSlot, range: DateRange) {
  const from = toDateKey(range.from)
  const to = toDateKey(range.to)
  const key = `${slot}|${from}|${to}`
  const [result, setResult] = useState<{ key: string; data: StatsResult | null } | null>(null)

  useEffect(() => {
    const start = parseDateKey(from)
    const end = parseDateKey(to)
    if (!start || !end) return
    // 늦게 온 이전 조건 결과는 버림
    let stale = false
    getReadingStats(slot, { from: start, to: end })
      .then((data) => {
        if (!stale) setResult({ key, data })
      })
      .catch(() => {
        if (!stale) setResult({ key, data: null })
      })
    return () => {
      stale = true
    }
  }, [key, slot, from, to])

  if (result?.key !== key) return { status: 'loading' as const, data: null }
  if (!result.data) return { status: 'error' as const, data: null }
  return { status: 'done' as const, data: result.data }
}
