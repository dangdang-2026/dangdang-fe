import { useEffect, useRef, type ReactNode } from 'react'

type BottomSheetProps = {
  label: string
  onClose: () => void
  children: ReactNode
}

// 열린 시트 순서. Esc는 맨 위 시트만 닫음
const openSheets: symbol[] = []

// Figma 바텀시트 공통 틀: 딤 + 위 모서리 둥근 시트 + 손잡이. 딤·Esc로 닫힘
function BottomSheet({ label, onClose, children }: BottomSheetProps) {
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // 열릴 때 한 번 등록. onClose가 바뀌어도 순서가 안 바뀌게
  useEffect(() => {
    const id = Symbol('sheet')
    openSheets.push(id)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && openSheets.at(-1) === id) onCloseRef.current()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      openSheets.splice(openSheets.indexOf(id), 1)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-60">
      <button
        type="button"
        aria-label="닫기"
        className="bg-dim animate-fade-in absolute inset-0"
        onClick={onClose}
      />
      {/* 내용이 길면 화면 위 48px 남기고 시트 안에서 스크롤 */}
      <section
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="rounded-t-sheet shadow-sheet animate-sheet-up absolute bottom-0 left-1/2 flex max-h-[calc(100dvh-(--spacing(12)))] w-full max-w-107.5 -translate-x-1/2 flex-col gap-4.5 overflow-y-auto bg-white px-5 pt-13 pb-[max(--spacing(9),env(safe-area-inset-bottom))] *:shrink-0 motion-reduce:animate-none"
      >
        <span className="bg-grey-100 absolute top-2 left-1/2 h-1 w-20 -translate-x-1/2 rounded-full" />
        {children}
      </section>
    </div>
  )
}

export default BottomSheet
