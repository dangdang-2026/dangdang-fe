import { useEffect, type ReactNode } from 'react'
import iconBack from '@/assets/icons/chat/back.svg'

type LegalLayoutProps = {
  title: string
  onBack: () => void
  // 아래 고정 버튼. 예: 동의하기 · 확인했어요
  footer?: { label: string; onClick: () => void }
  children: ReactNode
}

// Figma N-01~N-07 약관 문서 공통 틀: 줄 그은 머리 + 본문 + 아래 버튼
function LegalLayout({ title, onBack, footer, children }: LegalLayoutProps) {
  // 긴 문서끼리 오갈 때 앞 문서 스크롤 위치가 남지 않게
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white break-keep">
      <header className="sticky top-0 z-10 bg-white pt-12.5">
        <div className="border-grey-100 relative flex h-14 items-center border-b px-4">
          <button type="button" aria-label="뒤로" onClick={onBack}>
            <img src={iconBack} alt="" width={24} height={24} />
          </button>
          <h1 className="text-subtitle-1 text-grey-900 absolute left-1/2 -translate-x-1/2">
            {title}
          </h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4.5 px-5 pt-5 pb-10">{children}</div>

      {footer && (
        <div className="border-grey-100 sticky bottom-0 border-t bg-white px-5 pt-3 pb-[max(--spacing(7.5),env(safe-area-inset-bottom))]">
          <button
            type="button"
            className="bg-primary rounded-key w-full py-4 text-base leading-snug font-bold text-white"
            onClick={footer.onClick}
          >
            {footer.label}
          </button>
        </div>
      )}
    </main>
  )
}

export default LegalLayout
