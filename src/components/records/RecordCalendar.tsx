import { useState } from 'react'
import iconPrev from '@/assets/icons/calendar/prev.svg'
import dotGrey from '@/assets/icons/dot-grey.svg'
import dotPrimary from '@/assets/icons/dot-primary.svg'
import CalendarToggle from '@/components/records/CalendarToggle'
import { useRangeSync } from '@/hooks/useRangeSync'
import { useRecordCalendar } from '@/hooks/useRecordCalendar'
import { useRecordStart } from '@/hooks/useRecordStart'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { useVisitStore } from '@/stores/useVisitStore'
import {
  addMonths,
  getMonthGrid,
  isSameDay,
  startOfDay,
  startOfMonth,
  toDateKey,
} from '@/utils/date'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function VisitTag() {
  return <span className="text-mini text-grey-700 rounded-sm bg-yellow-100 px-1">진료</span>
}

type RecordCalendarProps = {
  today: Date
  // 처음 펼칠 때 보여 줄 달(고른 날의 달)
  initialMonth: Date
  onSelect: (date: Date) => void
  onCollapse: () => void
}

// Figma D-13 기록 달력 · D-14 지난 달 · D-15 처음 쓰는 달. 주간 띠에서 펼침
function RecordCalendar({ today, initialMonth, onSelect, onCollapse }: RecordCalendarProps) {
  const meals = useGlucoseStore((state) => state.meals)
  const records = useGlucoseStore((state) => state.records)
  const insulins = useGlucoseStore((state) => state.insulins)
  const nextVisitAt = useVisitStore((state) => state.nextVisitAt)
  const pastVisits = useVisitStore((state) => state.pastVisits)

  const localStart = useRecordStart(today)
  const recordDates = [
    ...records.map((record) => record.measuredAt),
    ...meals.map((meal) => meal.startedAt),
    ...insulins.map((insulin) => insulin.takenAt),
  ].map((iso) => new Date(iso))

  const [month, setMonth] = useState(() => startOfMonth(initialMonth))
  // 서버 달력을 받으면 서버 기준, 받기 전 · 실패면 기기 기록 기준
  const calendar = useRecordCalendar(month)
  // 보는 달 기록을 서버와 맞춤. 앱 켤 때 받지 않는 31일보다 오래된 변경도 반영
  useRangeSync(month, new Date(month.getFullYear(), month.getMonth() + 1, 0))
  const start = calendar?.firstRecordDate ?? localStart
  const isCurrentMonth = month >= startOfMonth(today)
  const prevDisabled = calendar ? !calendar.hasPrevMonth : month <= startOfMonth(localStart)
  const nextDisabled = calendar ? !calendar.hasNextMonth : isCurrentMonth
  // 지난 진료일과 다음 진료일 모두 진료 태그
  const visitDays = [...pastVisits, ...(nextVisitAt ? [nextVisitAt] : [])].map((at) =>
    startOfDay(new Date(at)),
  )
  const isVisitDay = (date: Date) => visitDays.some((day) => isSameDay(day, date))
  const hasVisit = visitDays.some((day) => isSameDay(startOfMonth(day), month))
  // 인슐린 · 못 보낸 식사는 기기에만 있어서 기기 기록도 같이 봄
  const hasRecord = (date: Date) =>
    calendar?.statuses.get(toDateKey(date)) === 'RECORDED' ||
    recordDates.some((recordDate) => isSameDay(recordDate, date))
  // 앞으로 올 날 · 기록 시작(서버는 가입) 전 날
  const isInactive = (date: Date) => {
    const status = calendar?.statuses.get(toDateKey(date))
    if (status) return status === 'FUTURE' || status === 'BEFORE_SIGNUP'
    return date > today || date < localStart
  }

  // 이 달에 기록을 시작했으면 시작일 안내
  const startsThisMonth = isSameDay(startOfMonth(start), month)
  const note = startsThisMonth
    ? `${start.getMonth() + 1}월 ${start.getDate()}일부터 기록했어요.${isCurrentMonth ? '' : ' 그 전 날짜는 기록이 없어요.'}`
    : '날짜를 누르면 그날 기록을 볼 수 있어요.'

  return (
    <>
      <section className="shadow-card flex flex-col gap-3 rounded-3xl bg-white px-3.5 pt-4.5 pb-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="이전 달"
            disabled={prevDisabled}
            className="disabled:invisible"
            onClick={() => setMonth(addMonths(month, -1))}
          >
            <img src={iconPrev} alt="" width={20} height={20} />
          </button>
          <h2 className="text-subtitle-1 text-grey-900">
            {month.getFullYear()}년 {month.getMonth() + 1}월
          </h2>
          <button
            type="button"
            aria-label="다음 달"
            disabled={nextDisabled}
            className="disabled:opacity-30"
            onClick={() => setMonth(addMonths(month, 1))}
          >
            <img src={iconPrev} alt="" width={20} height={20} className="rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-7">
          {WEEKDAYS.map((weekday) => (
            <span
              key={weekday}
              className="text-grey-600 h-4.5 text-center text-xs leading-normal font-medium"
            >
              {weekday}
            </span>
          ))}
        </div>

        <ul className="grid grid-cols-7 gap-y-1">
          {getMonthGrid(month).map((date, index) => {
            if (!date) return <li key={`blank-${index}`} className="h-15.5" />
            const isToday = isSameDay(date, today)
            // 앞으로 올 날 · 기록 시작 전 날은 흐리게, 누를 수 없음
            const inactive = isInactive(date)
            const dot = isToday ? dotPrimary : !inactive && hasRecord(date) ? dotGrey : null

            return (
              <li key={date.toISOString()} className="h-15.5">
                <button
                  type="button"
                  disabled={inactive}
                  aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일`}
                  aria-current={isToday ? 'date' : undefined}
                  className="flex w-full flex-col items-center gap-0.5"
                  onClick={() => onSelect(date)}
                >
                  <span
                    className={`text-input flex size-9 items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-primary font-bold text-white'
                        : inactive
                          ? 'text-grey-300'
                          : 'text-grey-900'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <span className="flex size-1.5 items-center justify-center">
                    {dot && <img src={dot} alt="" width={5} height={5} />}
                  </span>
                  {isVisitDay(date) && <VisitTag />}
                </button>
              </li>
            )
          })}
        </ul>

        <div className="text-grey-600 flex items-center gap-3.5 pt-1 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <img src={dotGrey} alt="" width={5} height={5} />
            기록 있음
          </span>
          {isCurrentMonth && (
            <span className="flex items-center gap-1.5">
              <img src={dotPrimary} alt="" width={5} height={5} />
              오늘
            </span>
          )}
          {hasVisit && (
            <span className="flex items-center gap-1.5">
              <VisitTag />
              진료일
            </span>
          )}
        </div>

        <CalendarToggle expanded onClick={onCollapse} />
      </section>

      <p className="text-t7 text-grey-600 mt-4">{note}</p>
    </>
  )
}

export default RecordCalendar
