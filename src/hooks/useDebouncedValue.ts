import { useEffect, useState } from 'react'

// 값이 delay 동안 안 바뀌면 그때 값. 입력할 때마다 서버를 부르지 않게
export function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}
