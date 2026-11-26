import { useStatusBarColor } from '@/hooks/useStatusBarColor'

// 탭 화면 전체 배경. 탭 바 뒤까지 채우도록 고정, 상태 바도 맨 위 색(yellow-50)으로
function WarmBackground() {
  useStatusBarColor('--color-yellow-50')
  return (
    <div
      aria-hidden
      className="to-bg-warm fixed inset-y-0 left-1/2 -z-10 w-full max-w-107.5 -translate-x-1/2 bg-linear-to-b from-yellow-50"
    />
  )
}

export default WarmBackground
