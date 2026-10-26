import { useEffect, useState } from 'react'

// 남은 시간·상태 전환용 현재 시각. 기본 15초마다 갱신
export function useNow(intervalMs = 15000) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])

  return now
}
