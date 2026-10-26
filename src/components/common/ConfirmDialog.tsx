import { useEffect } from 'react'

type ConfirmDialogProps = {
  title: string
  description: string
  confirmLabel: string
  // 지우기처럼 되돌릴 수 없으면 빨간 버튼
  danger?: boolean
  // 왼쪽 버튼. 없으면 취소로 닫기
  cancel?: { label: string; onClick: () => void }
  // 버튼 아래 밑줄 글자 버튼. 예: 계속 쓰기
  link?: { label: string; onClick: () => void }
  onConfirm: () => void
  onClose: () => void
}

// Figma U-31·U-16 가운데 확인창. 딤·Esc로 닫힘
function ConfirmDialog({
  title,
  description,
  confirmLabel,
  danger,
  cancel,
  link,
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
            onClick={cancel?.onClick ?? onClose}
          >
            {cancel?.label ?? '취소'}
          </button>
          <button
            type="button"
            className={`h-12 flex-1 rounded-xl text-base leading-none font-bold ${
              danger ? 'bg-red-500 text-white' : 'bg-primary text-grey-900'
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
        {link && (
          <button
            type="button"
            className="text-grey-600 mt-2 self-center text-sm leading-snug font-medium underline"
            onClick={link.onClick}
          >
            {link.label}
          </button>
        )}
      </section>
    </div>
  )
}

export default ConfirmDialog
