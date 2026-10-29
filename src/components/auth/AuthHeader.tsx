import type { ReactNode } from 'react'
import iconBack from '@/assets/icons/auth/back.svg'

type AuthHeaderProps = {
  onBack: () => void
  // 가운데 제목이나 진행 점
  children?: ReactNode
}

// Figma 로그인·가입 머리: 회색 원 뒤로 버튼 + 가운데 내용
function AuthHeader({ onBack, children }: AuthHeaderProps) {
  return (
    <header className="relative flex h-11 items-center">
      <button
        type="button"
        aria-label="뒤로"
        className="bg-grey-100 flex size-10 items-center justify-center rounded-full"
        onClick={onBack}
      >
        <img src={iconBack} alt="" width={20} height={20} />
      </button>
      {children && <div className="absolute left-1/2 -translate-x-1/2">{children}</div>}
    </header>
  )
}

export default AuthHeader
