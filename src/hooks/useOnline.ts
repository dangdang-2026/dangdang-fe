import { useEffect, useState } from 'react'

// 인터넷 연결 상태. 끊기면 커뮤니티 오류 화면
export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  return { online, recheck: () => setOnline(navigator.onLine) }
}
