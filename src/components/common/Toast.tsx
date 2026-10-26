import { useEffect } from 'react'

const TOAST_DURATION_MS = 2500

type ToastProps = {
  message: string
  onClose: () => void
}

// Figma H-06 토스트. 챗봇 버튼 아래쪽에 맞춰 탭 바 위 고정
function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [message, onClose])

  return (
    <div
      role="status"
      className="pointer-events-none fixed bottom-[calc(--spacing(22.5)+max(--spacing(5),env(safe-area-inset-bottom)))] left-1/2 z-50 w-full max-w-107.5 -translate-x-1/2 px-5"
    >
      <p className="bg-grey-900 text-t6 animate-fade-in rounded-key px-4.5 py-3.5 font-bold text-white motion-reduce:animate-none">
        {message}
      </p>
    </div>
  )
}

export default Toast
