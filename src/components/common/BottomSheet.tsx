import { useEffect, useRef, useState, type ReactNode } from 'react'

type BottomSheetProps = {
  label: string
  onClose: () => void
  children: ReactNode
}

// 열린 시트 순서. Esc · Tab 가두기는 맨 위 시트만
const openSheets: symbol[] = []

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Figma 바텀시트 공통 틀: 딤 + 위 모서리 둥근 시트 + 손잡이. 딤·Esc로 닫힘
function BottomSheet({ label, onClose, children }: BottomSheetProps) {
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const sheetRef = useRef<HTMLElement>(null)
  // 시트를 연 버튼. 안쪽 입력칸이 먼저 포커스를 받기 전에 기억
  const [opener] = useState(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  )

  // 열릴 때 한 번 등록. onClose가 바뀌어도 순서가 안 바뀌게
  // 시트로 포커스를 옮기고 Tab은 시트 안에서만, 닫으면 연 버튼으로 돌려줌
  useEffect(() => {
    const id = Symbol('sheet')
    openSheets.push(id)
    // 안쪽 입력칸이 이미 포커스를 받았으면(autoFocus) 그대로
    if (!sheetRef.current?.contains(document.activeElement)) {
      sheetRef.current?.focus({ preventScroll: true })
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (openSheets.at(-1) !== id) return
      if (event.key === 'Escape') onCloseRef.current()
      if (event.key !== 'Tab' || !sheetRef.current) return
      const focusable = [...sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (focusable.length === 0) return event.preventDefault()
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const inside = sheetRef.current.contains(document.activeElement)
      if (
        event.shiftKey &&
        (!inside || document.activeElement === first || document.activeElement === sheetRef.current)
      ) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (!inside || document.activeElement === last)) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      openSheets.splice(openSheets.indexOf(id), 1)
      window.removeEventListener('keydown', handleKeyDown)
      if (opener?.isConnected) opener.focus({ preventScroll: true })
    }
  }, [opener])

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
        ref={sheetRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="rounded-t-sheet shadow-sheet animate-sheet-up absolute bottom-0 left-1/2 flex max-h-[calc(100dvh-(--spacing(12)))] w-full max-w-107.5 -translate-x-1/2 flex-col gap-4.5 overflow-y-auto bg-white px-5 pt-13 pb-[max(--spacing(9),env(safe-area-inset-bottom))] outline-none *:shrink-0 motion-reduce:animate-none"
      >
        <span className="bg-grey-100 absolute top-2 left-1/2 h-1 w-20 -translate-x-1/2 rounded-full" />
        {children}
      </section>
    </div>
  )
}

export default BottomSheet
