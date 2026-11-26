import { useCallback, useEffect, useState } from 'react'
import { getToday } from '@/api/today'
import { syncServerRange } from '@/stores/useGlucoseStore'

// 오늘 화면에 들어올 때 오늘 혈당 · 식사 · 인슐린을 서버와 맞춤. pushReady는 서버에 살아 있는 푸시 구독이 있는지
export function useTodaySync() {
  const [pushReady, setPushReady] = useState<boolean | null>(null)

  useEffect(() => {
    let stale = false
    // 실패하면 기기 기록 그대로 보여 줌
    syncServerRange(getToday)
      .then((data) => {
        if (!stale) setPushReady(data.pushReady)
      })
      .catch(() => {})
    return () => {
      stale = true
    }
  }, [])

  // 화면에서 구독을 새로 만들면 다시 묻지 않고 켜진 걸로
  const markPushReady = useCallback(() => setPushReady(true), [])
  return { pushReady, markPushReady }
}
