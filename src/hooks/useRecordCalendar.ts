import { useEffect, useState } from 'react'
import { getRecordCalendar } from '@/api/records'
import { parseDateKey, toDateKey } from '@/utils/date'

type Calendar = Awaited<ReturnType<typeof getRecordCalendar>>

// 보는 달의 서버 달력. 받기 전 · 실패면 null이라 화면은 기기 기록으로 그림
export function useRecordCalendar(month: Date) {
  const key = toDateKey(month)
  const [result, setResult] = useState<{ key: string; data: Calendar } | null>(null)

  useEffect(() => {
    const start = parseDateKey(key)
    if (!start) return
    // 늦게 온 이전 달 결과는 버림
    let stale = false
    getRecordCalendar(start)
      .then((data) => {
        if (!stale) setResult({ key, data })
      })
      .catch(() => {})
    return () => {
      stale = true
    }
  }, [key])

  return result?.key === key ? result.data : null
}
