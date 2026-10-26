import { useEffect, useRef } from 'react'

// delay만큼 뒤에 한 번 실행. null이면 멈춤
export function useTimeout(callback: () => void, delay: number | null) {
  const saved = useRef(callback)

  useEffect(() => {
    saved.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) return
    const timer = window.setTimeout(() => saved.current(), delay)
    return () => window.clearTimeout(timer)
  }, [delay])
}
