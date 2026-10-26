import { formatMonthDayWeekday } from '@/utils/date'
import iconBell from '@/assets/icons/bell.svg'

type TodayHeaderProps = {
  name: string
  date: Date
  // 예: 진료 D-5. 진료일을 모르면 없음
  visitLabel?: string | null
}

function TodayHeader({ name, date, visitLabel }: TodayHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <p className="text-grey-500 text-sm leading-normal font-medium">
          {formatMonthDayWeekday(date)}
          {visitLabel && ` · ${visitLabel}`}
        </p>
        <h1 className="text-title-2 text-grey-900">{name}님, 반가워요</h1>
      </div>
      <button
        type="button"
        aria-label="알림"
        className="shadow-icon-button flex size-10.5 items-center justify-center rounded-full bg-white"
      >
        <img src={iconBell} alt="" width={20} height={20} />
      </button>
    </header>
  )
}

export default TodayHeader
