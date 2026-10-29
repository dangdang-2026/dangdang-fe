import { formatMonthDayWeekday } from '@/utils/date'
import iconBell from '@/assets/icons/bell.svg'
import iconUnread from '@/assets/icons/notification/unread.svg'

type TodayHeaderProps = {
  name: string
  date: Date
  // 예: 임신 26주 3일. 출산예정일을 모르면 날짜로
  pregnancyLabel?: string | null
  // 예: 진료 D-5. 진료일을 모르면 없음
  visitLabel?: string | null
  // 산후엔 '몸은 좀 어떠세요?'
  greeting?: string
  // 산후 홈엔 알림 버튼 없음
  showBell?: boolean
  // 안 읽은 알림이 있으면 종에 점
  unread?: boolean
  onBell?: () => void
}

function TodayHeader({
  name,
  date,
  pregnancyLabel,
  visitLabel,
  greeting = '반가워요',
  showBell = true,
  unread = false,
  onBell,
}: TodayHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <p className="text-grey-500 text-sm leading-normal font-medium">
          {pregnancyLabel ?? formatMonthDayWeekday(date)}
          {visitLabel && ` · ${visitLabel}`}
        </p>
        <h1 className="text-title-2 text-grey-900">
          {name}님, {greeting}
        </h1>
      </div>
      {showBell && (
        <button
          type="button"
          aria-label={unread ? '알림, 안 읽은 알림 있음' : '알림'}
          className="shadow-icon-button relative flex size-10.5 items-center justify-center rounded-full bg-white"
          onClick={onBell}
        >
          <img src={iconBell} alt="" width={20} height={20} />
          {unread && (
            <img
              src={iconUnread}
              alt=""
              width={6}
              height={6}
              className="absolute top-2.5 right-2.5"
            />
          )}
        </button>
      )}
    </header>
  )
}

export default TodayHeader
