import { useEffect } from 'react'

type ConfirmDialogProps = {
  title: string
  description: string
  confirmLabel: string
  // 지우기처럼 되돌릴 수 없으면 빨간 버튼
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}

// Figma U-31 가운데 확인창. 딤·Esc로 닫힘
function ConfirmDialog({
  title,
  description,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-9">
      <button
        type="button"
        aria-label="닫기"
        className="bg-dim animate-fade-in absolute inset-0"
        onClick={onClose}
      />
      <section
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="animate-fade-in relative flex w-full max-w-80 flex-col gap-2 rounded-3xl bg-white px-6 pt-7 pb-5 text-center"
      >
        <h2 className="text-t4 text-grey-900">{title}</h2>
        <p className="text-grey-600 text-sm leading-normal">{description}</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="bg-grey-100 text-grey-800 h-12 flex-1 rounded-xl text-base leading-none font-bold"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className={`h-12 flex-1 rounded-xl text-base leading-none font-bold text-white ${
              danger ? 'bg-red-500' : 'bg-primary'
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}

export default ConfirmDialog
