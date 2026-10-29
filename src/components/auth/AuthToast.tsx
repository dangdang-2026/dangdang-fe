import { useEffect } from 'react'

const TOAST_DURATION_MS = 3000

type AuthToastProps = {
  icon: string
  message: string
  onClose: () => void
}

// Figma K-05·K-06·L-10 로그인 토스트: 아이콘 + 두 줄까지 안내. 카카오 버튼 아래 고정
function AuthToast({ icon, message, onClose }: AuthToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [message, onClose])

  return (
    <div
      role="status"
      className="pointer-events-none fixed bottom-[calc(--spacing(17)+max(--spacing(9),env(safe-area-inset-bottom)))] left-1/2 z-50 w-full max-w-107.5 -translate-x-1/2 px-5"
    >
      <p className="bg-grey-800 rounded-key animate-fade-in flex items-center gap-2 px-4.5 py-3.5 text-sm leading-normal font-medium text-white motion-reduce:animate-none">
        <img src={icon} alt="" width={18} height={18} className="shrink-0" />
        {message}
      </p>
    </div>
  )
}

export default AuthToast
