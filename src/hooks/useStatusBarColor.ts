import { useEffect } from 'react'

// 화면 맨 위 배경이 기본(흰색)과 다를 때만 씀
const DEFAULT_TOKEN = '--color-background'
const FALLBACK_COLOR = '#ffffff'

// 지금 걸린 색 토큰. 스플래시처럼 화면을 덮는 것(overlay)이 먼저, 그다음 마지막에 건 것
const entries: { token: string; overlay: boolean }[] = []

function applyThemeColor() {
  const top = entries.findLast((entry) => entry.overlay) ?? entries.at(-1)
  const token = top?.token ?? DEFAULT_TOKEN
  const color = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', color || FALLBACK_COLOR)
}

// 상태 바(시간 · 배터리) 뒤 색을 화면 맨 위 배경과 맞춤. 글자는 status-bar-style default라 어두운 그대로
export function useStatusBarColor(token: string, overlay = false) {
  useEffect(() => {
    const entry = { token, overlay }
    entries.push(entry)
    applyThemeColor()
    return () => {
      entries.splice(entries.indexOf(entry), 1)
      applyThemeColor()
    }
  }, [token, overlay])
}
