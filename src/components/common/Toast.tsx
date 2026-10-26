import { useEffect } from 'react'

const TOAST_DURATION_MS = 2500
// 되돌리기 같은 버튼이 있으면 누를 시간을 더 줌
const ACTION_TOAST_DURATION_MS = 4000

type ToastProps = {
  message: string
  action?: { label: string; onClick: () => void }
  onClose: () => void
}

// Figma H-06·C-17 토스트. 챗봇 버튼 아래쪽에 맞춰 탭 바 위 고정
function Toast({ message, action, onClose }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, action ? ACTION_TOAST_DURATION_MS : TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [message, action, onClose])

  return (
    <div
      role="status"
      className="pointer-events-none fixed bottom-[calc(--spacing(22.5)+max(--spacing(5),env(safe-area-inset-bottom)))] left-1/2 z-50 w-full max-w-107.5 -translate-x-1/2 px-5"
    >
      <div className="bg-grey-900 text-t6 animate-fade-in rounded-key flex items-center px-4.5 py-3.5 font-bold motion-reduce:animate-none">
        <p className="flex-1 text-white">{message}</p>
        {action && (
          <button
            type="button"
            className="text-primary pointer-events-auto shrink-0"
            onClick={() => {
              action.onClick()
              onClose()
            }}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}

export default Toast
