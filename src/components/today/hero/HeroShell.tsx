import type { ReactNode } from 'react'
import iconPencil from '@/assets/icons/pencil.svg'

type HeroShellProps = {
  status: string
  postMealHours: number | null
  // 상태별 그라디언트 시작·끝 색
  gradient?: string
  // 언덕·당당이 등 카드 뒤 장식
  decoration?: ReactNode
  children: ReactNode
}

// Figma 「당당/홈 히어로 카드」 공통 틀: 상태 한 줄 + 병원 기준 칩
function HeroShell({
  status,
  postMealHours,
  gradient = 'from-yellow-50 to-yellow-100',
  decoration,
  children,
}: HeroShellProps) {
  return (
    <section
      className={`rounded-hero relative flex h-75 flex-col overflow-hidden bg-linear-147 from-14% to-86% px-5 pt-4.5 pb-5 ${gradient}`}
    >
      {decoration}

      <div className="relative flex items-start justify-between">
        <p className="text-body-3 text-primary mt-0.5">{status}</p>
        <button
          type="button"
          className="text-grey-800 flex items-center gap-1 rounded-full bg-white py-1 pr-2 pl-2.5 text-xs leading-normal font-semibold"
        >
          {postMealHours ? `식후 ${postMealHours}시간` : '측정 시점 모름'}
          <img src={iconPencil} alt="" width={12} height={12} />
        </button>
      </div>
      <div className="relative flex flex-1 flex-col">{children}</div>
    </section>
  )
}

export default HeroShell
