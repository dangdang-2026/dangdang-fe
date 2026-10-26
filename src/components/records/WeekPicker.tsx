import iconNavNext from '@/assets/icons/nav-next.svg'
import iconNavPrev from '@/assets/icons/nav-prev.svg'
import dotGrey from '@/assets/icons/dot-grey.svg'
import dotPrimary from '@/assets/icons/dot-primary.svg'
import { addDays, formatWeekLabel, isSameDay, startOfWeek } from '@/utils/date'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

type WeekPickerProps = {
  selected: Date
  today: Date
  // 기록이 있는 날 점 표시
  hasRecord: (date: Date) => boolean
  onSelect: (date: Date) => void
}

// Figma D-01 주간 날짜 선택. 오늘 이후는 고를 수 없음
function WeekPicker({ selected, today, hasRecord, onSelect }: WeekPickerProps) {
  const weekStart = startOfWeek(selected)
  const days = WEEKDAYS.map((_, index) => addDays(weekStart, index))
  const isCurrentWeek = isSameDay(weekStart, startOfWeek(today))

  // 주를 옮기면 같은 요일, 오늘을 넘으면 오늘
  const moveWeek = (offset: number) => {
    const next = addDays(selected, offset * 7)
    onSelect(next > today ? today : next)
  }

  return (
    <div className="shadow-card flex flex-col gap-3 rounded-3xl bg-white p-3.5">
      <div className="flex items-center justify-between">
        <button type="button" aria-label="지난주" onClick={() => moveWeek(-1)}>
          <img src={iconNavPrev} alt="" width={18} height={18} />
        </button>
        <p className="text-t6 text-grey-900 font-bold">{formatWeekLabel(weekStart)}</p>
        <button
          type="button"
          aria-label="다음 주"
          disabled={isCurrentWeek}
          className="disabled:opacity-30"
          onClick={() => moveWeek(1)}
        >
          <img src={iconNavNext} alt="" width={18} height={18} />
        </button>
      </div>

      <ul className="flex justify-between">
        {days.map((day, index) => {
          const isSelected = isSameDay(day, selected)
          const isFuture = day > today
          const dayColor = isSelected
            ? 'bg-primary text-white'
            : isFuture
              ? 'text-grey-300'
              : 'text-grey-900'

          return (
            <li key={day.toISOString()} className="flex flex-col items-center gap-1.5">
              <span className="text-grey-500 text-xs leading-normal font-medium">
                {WEEKDAYS[index]}
              </span>
              <button
                type="button"
                disabled={isFuture}
                aria-pressed={isSelected}
                aria-label={`${day.getMonth() + 1}월 ${day.getDate()}일`}
                className={`flex size-9 items-center justify-center rounded-full text-base leading-normal font-bold ${dayColor}`}
                onClick={() => onSelect(day)}
              >
                {day.getDate()}
              </button>
              {/* 점 자리는 항상 차지해 높이 유지 */}
              <span className="flex size-1.5 items-center justify-center">
                {!isFuture && hasRecord(day) && (
                  <img src={isSelected ? dotPrimary : dotGrey} alt="" width={5} height={5} />
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default WeekPicker
