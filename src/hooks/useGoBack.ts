import { useNavigate } from 'react-router'

// 앱 안에서 왔으면 이전 화면, 바로 열었으면 fallback으로
export function useGoBack(fallback: string) {
  const navigate = useNavigate()
  return () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate(fallback, { replace: true })
  }
}
