import { useState } from 'react'
import iconNavNext from '@/assets/icons/nav-next.svg'
import iconNavPrev from '@/assets/icons/nav-prev.svg'
import { isSameDay } from '@/utils/date'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

type MonthCalendarProps = {
  selected: Date | null
  today: Date
  onSelect: (date: Date) => void
}

// 달의 첫 주 일요일부터 마지막 날까지. 앞 빈칸은 null
function getMonthCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const lastDate = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: lastDate }, (_, index) => new Date(year, month, index + 1))
  return [...Array<null>(firstDay).fill(null), ...days]
}

// Figma C-01 달력. 오늘 이전은 고를 수 없음
function MonthCalendar({ selected, today, onSelect }: MonthCalendarProps) {
  const base = selected ?? today
  const [view, setView] = useState({ year: base.getFullYear(), month: base.getMonth() })
  const cells = getMonthCells(view.year, view.month)
  const isCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth()

  const moveMonth = (offset: number) => {
    const next = new Date(view.year, view.month + offset, 1)
    setView({ year: next.getFullYear(), month: next.getMonth() })
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="이전 달"
          disabled={isCurrentMonth}
          className="disabled:opacity-30"
          onClick={() => moveMonth(-1)}
        >
          <img src={iconNavPrev} alt="" width={18} height={18} />
        </button>
        <p className="text-grey-900 text-base leading-normal font-bold">
          {view.year}년 {view.month + 1}월
        </p>
        <button type="button" aria-label="다음 달" onClick={() => moveMonth(1)}>
          <img src={iconNavNext} alt="" width={18} height={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAYS.map((weekday) => (
          <span
            key={weekday}
            className="text-grey-500 flex h-7 items-center justify-center text-xs leading-normal font-medium"
          >
            {weekday}
          </span>
        ))}
        {cells.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />
          const isPast = day < today
          const isSelected = !!selected && isSameDay(day, selected)
          const isToday = isSameDay(day, today)
          const style = isSelected
            ? 'bg-primary font-bold text-white'
            : isToday
              ? 'border-2 border-yellow-300 text-grey-900 font-medium'
              : isPast
                ? 'text-grey-300 font-medium'
                : 'text-grey-900 font-medium'

          return (
            <span key={day.toISOString()} className="flex h-10 items-center justify-center">
              <button
                type="button"
                disabled={isPast}
                aria-pressed={isSelected}
                aria-label={`${day.getMonth() + 1}월 ${day.getDate()}일`}
                className={`text-t6 flex size-9 items-center justify-center rounded-full ${style}`}
                onClick={() => onSelect(day)}
              >
                {day.getDate()}
              </button>
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default MonthCalendar
