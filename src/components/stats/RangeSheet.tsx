import { useState } from 'react'
import iconNavNext from '@/assets/icons/nav-next.svg'
import iconNavPrev from '@/assets/icons/nav-prev.svg'
import BottomSheet from '@/components/common/BottomSheet'
import { addMonths, getMonthGrid, isSameDay, startOfMonth } from '@/utils/date'
import { formatRangeLabel, type DateRange } from '@/utils/stats'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

type RangeSheetProps = {
  today: Date
  // 기록 시작 전은 고를 수 없음
  start: Date
  initial: DateRange | null
  onApply: (range: DateRange) => void
  onClose: () => void
}

// Figma D-19 통계 기간 직접 고르기. 시작일 → 끝나는 날 차례로
function RangeSheet({ today, start, initial, onApply, onClose }: RangeSheetProps) {
  const [month, setMonth] = useState(() => startOfMonth(initial?.to ?? today))
  const [from, setFrom] = useState<Date | null>(initial?.from ?? null)
  const [to, setTo] = useState<Date | null>(initial?.to ?? null)

  const pick = (date: Date) => {
    // 둘 다 골랐거나 아직 없으면 새로 시작
    if (!from || to) {
      setFrom(date)
      setTo(null)
      return
    }
    if (date < from) {
      setTo(from)
      setFrom(date)
    } else setTo(date)
  }

  return (
    <BottomSheet label="통계 기간" onClose={onClose}>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-t4 text-grey-900">통계 기간</h2>
        <p className="text-t6 text-grey-700">시작일과 끝나는 날을 차례로 눌러 주세요.</p>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="이전 달"
          disabled={month <= startOfMonth(start)}
          className="disabled:opacity-30"
          onClick={() => setMonth(addMonths(month, -1))}
        >
          <img src={iconNavPrev} alt="" width={18} height={18} />
        </button>
        <p className="text-grey-900 text-base leading-normal font-bold">
          {month.getFullYear()}년 {month.getMonth() + 1}월
        </p>
        <button
          type="button"
          aria-label="다음 달"
          disabled={month >= startOfMonth(today)}
          className="disabled:opacity-30"
          onClick={() => setMonth(addMonths(month, 1))}
        >
          <img src={iconNavNext} alt="" width={18} height={18} />
        </button>
      </div>

      <div className="-mt-2 flex flex-col gap-1">
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((weekday) => (
            <span
              key={weekday}
              className="text-grey-600 flex h-7 items-center justify-center text-xs leading-normal font-medium"
            >
              {weekday}
            </span>
          ))}
        </div>
        <ul className="grid grid-cols-7">
          {getMonthGrid(month).map((date, index) => {
            if (!date) return <li key={`blank-${index}`} className="h-10" />
            const disabled = date > today || date < start
            const isEdge = (from && isSameDay(date, from)) || (to && isSameDay(date, to))
            const isBetween = !!from && !!to && date > from && date < to
            return (
              <li key={date.toISOString()} className="flex h-10 items-center justify-center">
                <button
                  type="button"
                  disabled={disabled}
                  aria-pressed={!!isEdge || isBetween}
                  aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일`}
                  className={`text-body-2 flex size-9 items-center justify-center rounded-full ${
                    isEdge
                      ? 'bg-primary text-white'
                      : isBetween
                        ? 'text-grey-900 bg-yellow-50'
                        : disabled
                          ? 'text-grey-300'
                          : 'text-grey-900'
                  }`}
                  onClick={() => pick(date)}
                >
                  {date.getDate()}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <button
        type="button"
        disabled={!from || !to}
        className="text-subtitle-1 bg-primary disabled:bg-grey-100 disabled:text-grey-400 h-14 rounded-xl leading-none text-white"
        onClick={() => from && to && onApply({ from, to })}
      >
        {from && to
          ? `${formatRangeLabel({ from, to })} 보기`
          : from
            ? '끝나는 날을 골라 주세요'
            : '시작일을 골라 주세요'}
      </button>
    </BottomSheet>
  )
}

export default RangeSheet
