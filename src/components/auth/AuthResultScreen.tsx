import type { ReactNode } from 'react'
import AuthHeader from '@/components/auth/AuthHeader'

type AuthResultScreenProps = {
  headerTitle: string
  title: string
  description: ReactNode
  icon: string
  // 큰 아이콘 원 배경색
  iconClassName: string
  onBack: () => void
  action: { label: string; onClick: () => void }
  // 버튼 위 보조 링크
  extra?: ReactNode
}

// Figma R-04·R-09·R-10 결과 화면: 제목 + 설명 + 가운데 큰 아이콘 + 아래 버튼
function AuthResultScreen({
  headerTitle,
  title,
  description,
  icon,
  iconClassName,
  onBack,
  action,
  extra,
}: AuthResultScreenProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-14.5 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
      <AuthHeader onBack={onBack}>
        <p className="text-subtitle-1 text-grey-900">{headerTitle}</p>
      </AuthHeader>

      <div className="mt-7 flex flex-col gap-1.5">
        <h1 className="text-title-2 text-grey-900">{title}</h1>
        <p className="text-grey-500 text-sm leading-normal">{description}</p>
      </div>

      <span
        className={`mt-22.5 flex size-22 items-center justify-center self-center rounded-full ${iconClassName}`}
      >
        <img src={icon} alt="" width={40} height={40} />
      </span>

      <div className="mt-auto flex flex-col gap-7 pt-6">
        {extra}
        <button
          type="button"
          className="text-subtitle-1 bg-primary h-14 rounded-xl leading-none text-white"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      </div>
    </main>
  )
}

export default AuthResultScreen
