import type { ReactNode } from 'react'
import iconBack from '@/assets/icons/chat/back.svg'
import iconClose from '@/assets/icons/meal/close.svg'

type PhotoScreenProps = {
  title: string
  // 검색에서 결과로 돌아갈 때만 뒤로, 나머지는 닫기
  back?: boolean
  onBack: () => void
  footer?: ReactNode
  children: ReactNode
}

// Figma F-11~F-15 사진 흐름 전체 화면 틀: 머리 + 내용 + 아래 버튼
function PhotoScreen({ title, back, onBack, footer, children }: PhotoScreenProps) {
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-60 bg-white">
      <div className="mx-auto flex h-full w-full max-w-107.5 flex-col pt-12.5">
        <header className="relative flex h-14 shrink-0 items-center px-4">
          <button type="button" aria-label={back ? '뒤로' : '닫기'} onClick={onBack}>
            <img src={back ? iconBack : iconClose} alt="" width={24} height={24} />
          </button>
          <h1 className="text-subtitle-1 text-grey-900 absolute left-1/2 -translate-x-1/2">
            {title}
          </h1>
        </header>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pt-2 pb-5">{children}</div>

        {footer && (
          <div className="flex shrink-0 flex-col items-center gap-2.5 px-5 pt-3 pb-[max(--spacing(7.5),env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default PhotoScreen
