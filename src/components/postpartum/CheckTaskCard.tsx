import type { ReactNode } from 'react'
import iconCalendar from '@/assets/icons/postpartum/calendar.svg'

type CheckTaskCardProps = {
  title: string
  description: ReactNode
  primary: { label: string; onClick: () => void }
  secondary: { label: string; onClick: () => void }
}

// Figma E-07 검사일 적어 두기 · E-05d 오늘 산후 검사: 달력 아이콘 + 제목 + 버튼 두 개
function CheckTaskCard({ title, description, primary, secondary }: CheckTaskCardProps) {
  return (
    <section className="rounded-hero shadow-task mt-4.5 flex flex-col gap-3.5 bg-white p-5">
      <div className="flex items-center gap-3">
        <span className="rounded-2xl bg-yellow-50 p-3">
          <img src={iconCalendar} alt="" width={22} height={22} />
        </span>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-grey-900 text-base leading-normal font-bold">{title}</h2>
          {description}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="bg-grey-900 h-12 flex-1 rounded-xl text-base leading-none font-bold text-white"
          onClick={primary.onClick}
        >
          {primary.label}
        </button>
        <button
          type="button"
          className="bg-grey-100 text-grey-900 h-12 flex-1 rounded-xl text-base leading-none font-bold"
          onClick={secondary.onClick}
        >
          {secondary.label}
        </button>
      </div>
    </section>
  )
}

export default CheckTaskCard
