import type { ReactNode } from 'react'
import hill from '@/assets/images/dangdang/hill-sm.svg'
import dangdangBody from '@/assets/images/dangdang/body.svg'

type HillDangdangProps = {
  // 몸통+얼굴이 합쳐진 그림이면 face 없이 body만
  body?: string
  face?: string
}

// 카드 오른쪽 언덕 위 당당이(118px)
export function HillDangdang({ body = dangdangBody, face }: HillDangdangProps) {
  return (
    <>
      <img
        src={hill}
        alt=""
        width={260}
        height={120}
        className="absolute top-37.5 -right-20 max-w-none"
      />
      <span aria-hidden className="absolute top-12.5 right-4.5 size-29.5">
        <img src={body} alt="" className="absolute top-2/15 left-7/40 max-w-none" />
        {face && <img src={face} alt="" width={118} height={118} className="absolute inset-0" />}
      </span>
    </>
  )
}

type HeroButtonProps = {
  icon: string
  children: ReactNode
  light?: boolean
  onClick?: () => void
}

// 카드 아래 행동 버튼 하나
export function HeroButton({ icon, children, light, onClick }: HeroButtonProps) {
  const color = light ? 'bg-white text-grey-900' : 'bg-grey-900 text-grey-50'

  return (
    <button
      type="button"
      className={`text-subtitle-1 mt-auto flex h-14 items-center justify-center gap-2 rounded-2xl ${color}`}
      onClick={onClick}
    >
      <img src={icon} alt="" width={20} height={20} />
      {children}
    </button>
  )
}

// 카드 안 흰 칩(최근 기록·기록했어요 등)
export function HeroChip({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <p className="text-grey-800 flex w-fit items-center gap-1 rounded-full bg-white py-1.5 pr-3 pl-2.5 text-xs leading-normal font-semibold">
      <img src={icon} alt="" width={14} height={14} />
      {children}
    </p>
  )
}
