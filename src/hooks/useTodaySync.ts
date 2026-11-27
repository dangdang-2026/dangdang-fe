import { useCallback, useEffect, useState } from 'react'
import { retryPendingOpens } from '@/api/reminders'
import { getToday } from '@/api/today'
import { sendUnsentGlucose, syncServerRange } from '@/stores/useGlucoseStore'
import { addDays, startOfDay } from '@/utils/date'

// 오늘 화면에 들어올 때 · 앱으로 돌아올 때 · 날짜가 바뀔 때 · 다시 연결될 때 오늘 기록을 서버와 맞춤
// 못 보낸 식사부터 보내고 받음. pushReady는 서버에 살아 있는 푸시 구독이 있는지
export function useTodaySync() {
  const [pushReady, setPushReady] = useState<boolean | null>(null)

  useEffect(() => {
    let stale = false
    // 실패하면 기기 기록 그대로 보여 줌
    const sync = () => {
      void retryPendingOpens().catch(() => {})
      void sendUnsentGlucose()
        .catch(() => {})
        .then(() => syncServerRange(getToday))
        .then((data) => {
          if (!stale) setPushReady(data.pushReady)
        })
        .catch(() => {})
    }
    sync()
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', sync)
    // 자정이 지나면 새 날짜로 다시 받음
    let midnight = 0
    const scheduleMidnight = () => {
      midnight = window.setTimeout(
        () => {
          sync()
          scheduleMidnight()
        },
        addDays(startOfDay(new Date()), 1).getTime() - Date.now() + 1000,
      )
    }
    scheduleMidnight()
    return () => {
      stale = true
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', sync)
      window.clearTimeout(midnight)
    }
  }, [])

  // 화면에서 구독을 새로 만들면 다시 묻지 않고 켜진 걸로
  const markPushReady = useCallback(() => setPushReady(true), [])
  return { pushReady, markPushReady }
}
