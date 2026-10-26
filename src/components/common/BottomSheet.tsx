import { useEffect, type ReactNode } from 'react'

type BottomSheetProps = {
  label: string
  onClose: () => void
  children: ReactNode
}

// Figma 바텀시트 공통 틀: 딤 + 위 모서리 둥근 시트 + 손잡이. 딤·Esc로 닫힘
function BottomSheet({ label, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-60">
      <button
        type="button"
        aria-label="닫기"
        className="bg-dim animate-fade-in absolute inset-0"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="rounded-t-sheet shadow-sheet animate-sheet-up absolute bottom-0 left-1/2 flex w-full max-w-107.5 -translate-x-1/2 flex-col gap-4.5 bg-white px-5 pt-13 pb-[max(--spacing(9),env(safe-area-inset-bottom))] motion-reduce:animate-none"
      >
        <span className="bg-grey-100 absolute top-2 left-1/2 h-1 w-20 -translate-x-1/2 rounded-full" />
        {children}
      </section>
    </div>
  )
}

export default BottomSheet
