import { useState } from 'react'
import { useNavigate } from 'react-router'
import iconPrev from '@/assets/icons/calendar/prev.svg'
import dotGrey from '@/assets/icons/dot-grey.svg'
import dotPrimary from '@/assets/icons/dot-primary.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import WarmBackground from '@/components/common/WarmBackground'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useNow } from '@/hooks/useNow'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
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

// Figma D-13 기록 달력 · D-14 지난 달 · D-15 처음 쓰는 달
function RecordCalendarPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.RECORDS)
  const meals = useGlucoseStore((state) => state.meals)
  const records = useGlucoseStore((state) => state.records)
  const insulins = useGlucoseStore((state) => state.insulins)
  const completedAt = useOnboardingStore((state) => state.completedAt)
  const nextVisitAt = useVisitStore((state) => state.nextVisitAt)
  const today = startOfDay(useNow())

  // 기록을 시작한 날: 설정을 마친 날과 가장 이른 기록 중 앞선 날
  const recordDates = [
    ...records.map((record) => record.measuredAt),
    ...meals.map((meal) => meal.startedAt),
    ...insulins.map((insulin) => insulin.takenAt),
  ].map((iso) => new Date(iso))
  const startCandidates = completedAt ? [...recordDates, new Date(completedAt)] : recordDates
  const start = startOfDay(
    startCandidates.length
      ? new Date(Math.min(...startCandidates.map((date) => date.getTime())))
      : today,
  )

  const [month, setMonth] = useState(() => startOfMonth(today))
  const isStartMonth = month <= startOfMonth(start)
  const isCurrentMonth = month >= startOfMonth(today)
  const visitDay = nextVisitAt ? startOfDay(new Date(nextVisitAt)) : null
  const hasVisit = !!visitDay && isSameDay(startOfMonth(visitDay), month)
  const hasRecord = (date: Date) => recordDates.some((recordDate) => isSameDay(recordDate, date))

  // 이 달에 기록을 시작했으면 시작일 안내
  const startsThisMonth = isSameDay(startOfMonth(start), month)
  const note = startsThisMonth
    ? `${start.getMonth() + 1}월 ${start.getDate()}일부터 기록했어요.${isCurrentMonth ? '' : ' 그 전 날짜는 기록이 없어요.'}`
    : '날짜를 누르면 그날 기록을 볼 수 있어요.'

  const openDay = (date: Date) => {
    const search = isSameDay(date, today) ? '' : `?date=${toDateKey(date)}`
    navigate(`${ROUTES.RECORDS}${search}`, { replace: true })
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 px-5 pt-13 pb-10">
      <WarmBackground />
      <div className="relative">
        <SubPageHeader title="기록 달력" onBack={goBack} />

        <section className="shadow-card mt-4 flex flex-col gap-3 rounded-3xl bg-white px-3.5 pt-4.5 pb-3.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="이전 달"
              disabled={isStartMonth}
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
              disabled={isCurrentMonth}
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
              const inactive = date > today || date < start
              const dot = isToday ? dotPrimary : !inactive && hasRecord(date) ? dotGrey : null

              return (
                <li key={date.toISOString()} className="h-15.5">
                  <button
                    type="button"
                    disabled={inactive}
                    aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일`}
                    aria-current={isToday ? 'date' : undefined}
                    className="flex w-full flex-col items-center gap-0.5"
                    onClick={() => openDay(date)}
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
                    {visitDay && isSameDay(date, visitDay) && <VisitTag />}
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
        </section>

        <p className="text-t7 text-grey-600 mt-4">{note}</p>
      </div>
    </main>
  )
}

export default RecordCalendarPage
