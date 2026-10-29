import { useCallback, useState, type ReactNode } from 'react'
import SubPageHeader from '@/components/common/SubPageHeader'
import RangeSheet from '@/components/stats/RangeSheet'
import StatsChart from '@/components/stats/StatsChart'
import { MEAL_LABEL, MEAL_ORDER } from '@/constants/glucose'
import { ROUTES } from '@/constants/routes'
import { useCriteria } from '@/hooks/useCriteria'
import { useGoBack } from '@/hooks/useGoBack'
import { useNow } from '@/hooks/useNow'
import { useRecordStart } from '@/hooks/useRecordStart'
import { useCriteriaStore } from '@/stores/useCriteriaStore'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { countCriteriaChanges } from '@/utils/criteria'
import { addDays, startOfDay } from '@/utils/date'
import {
  PERIOD_DAYS,
  PERIOD_LABEL,
  PERIOD_NAMES,
  formatDelta,
  formatRangeLabel,
  formatShortRange,
  getPeriodStats,
  getPreviousRange,
  type DateRange,
  type StatsPeriod,
  type StatsSlot,
} from '@/utils/stats'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const PERIODS: StatsPeriod[] = ['1w', '2w', '1m', '3m', 'custom']

// 받침 있으면 과, 없으면 와. 숫자로 끝나면 과
function withAnd(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  const hasBatchim = code < 0 || code > 11171 || code % 28 !== 0
  return `${word}${hasBatchim ? '과' : '와'}`
}

const monthDay = (date: Date) => `${date.getMonth() + 1}월 ${date.getDate()}일`

type RowProps = {
  title: string
  description?: string
  value: string
  // 지난 기간과 비교 한 줄. 비교할 기록이 없으면 없음
  note?: string
  highlight?: boolean
}

function StatRow({ title, description, value, note, highlight }: RowProps) {
  return (
    <li className="border-grey-100 flex items-center justify-between border-t py-3.5 first:border-t-0">
      <div className="flex flex-col gap-0.5">
        <p className="text-body-2 text-grey-800">{title}</p>
        {description && <p className="text-grey-600 text-xs leading-normal">{description}</p>}
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <p className={`text-subtitle-1 ${highlight ? 'text-blue-500' : 'text-grey-900'}`}>
          {value}
        </p>
        {note && <p className="text-grey-600 text-xs leading-normal font-medium">{note}</p>}
      </div>
    </li>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3 py-6">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-grey-900 text-lg leading-snug font-bold">{title}</h2>
        <p className="text-t7 text-grey-600">{description}</p>
      </div>
      <ul className="flex flex-col">{children}</ul>
    </section>
  )
}

// Figma D-17~D-21 혈당 통계. 지난 같은 길이 기간과 비교만, 판단은 하지 않음
function StatsPage() {
  const goBack = useGoBack(ROUTES.RECORDS)
  const today = startOfDay(useNow())
  const start = useRecordStart(today)
  const records = useGlucoseStore((state) => state.records)
  const meals = useGlucoseStore((state) => state.meals)
  const versions = useCriteriaStore((state) => state.versions)
  const criteria = useCriteria()

  // 들어오면 공복부터
  const [slot, setSlot] = useState<StatsSlot>('fasting')
  const [period, setPeriod] = useState<StatsPeriod>('1m')
  const [custom, setCustom] = useState<DateRange | null>(null)
  const [rangeSheet, setRangeSheet] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const closeRangeSheet = useCallback(() => setRangeSheet(false), [])

  const fullRange: DateRange =
    period === 'custom' && custom
      ? custom
      : {
          from: addDays(today, -(PERIOD_DAYS[period === 'custom' ? '1m' : period] - 1)),
          to: today,
        }
  // 기록을 시작하기 전 날은 빼고 셈
  const clipped = fullRange.from < start
  const range = { from: clipped ? start : fullRange.from, to: fullRange.to }
  const previousRange = getPreviousRange(fullRange)
  const now = new Date()
  const stats = getPeriodStats(slot, range, records, meals, versions, now)
  const previous = getPeriodStats(slot, previousRange, records, meals, versions, now)
  const hasPrevious = !clipped && previous.count > 0
  const names = PERIOD_NAMES[period]

  const target =
    slot === 'fasting'
      ? criteria.targets.fasting
      : criteria.postMealHours
        ? criteria.targets.postMeal
        : null
  const slotLabel =
    slot === 'fasting'
      ? '공복'
      : criteria.postMealHours
        ? `식후 ${criteria.postMealHours}시간`
        : '식후'
  const periodLabel =
    period === 'custom' && custom ? formatRangeLabel(custom) : `최근 ${PERIOD_LABEL[period]}`

  const selectedDay = selected !== null ? stats.days[selected] : null
  const previousDay = selected !== null ? previous.days[selected] : null

  // 예: ▲ 8%p · 지난달 74%
  const compareNote = (
    current: number | null,
    before: number | null,
    unit: string,
    beforeUnit = unit,
  ) => {
    if (!hasPrevious) return undefined
    const delta = formatDelta(current, before, unit)
    return delta
      ? `${delta} · ${names.previous} ${before ?? '—'}${beforeUnit}`
      : `${withAnd(names.previous)} 같아요`
  }

  const changePeriod = (next: StatsPeriod) => {
    setSelected(null)
    if (next === 'custom') {
      setRangeSheet(true)
      return
    }
    setPeriod(next)
  }

  const mealAverages = MEAL_ORDER.filter((type) => stats.byMeal[type] !== null)
  const highestMeal = mealAverages.reduce<(typeof MEAL_ORDER)[number] | null>(
    (best, type) =>
      best === null || (stats.byMeal[type] ?? 0) > (stats.byMeal[best] ?? 0) ? type : best,
    null,
  )
  const criteriaChanged = countCriteriaChanges(versions, previousRange.from, range.to) > 0

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-6 break-keep">
      <SubPageHeader title="혈당 통계" onBack={goBack} />

      <div role="tablist" className="bg-grey-100 mt-2 flex rounded-xl p-1">
        {(['fasting', 'post-meal'] as StatsSlot[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={slot === key}
            className={`flex-1 rounded-lg py-2 text-sm leading-snug ${
              slot === key
                ? 'shadow-segment text-grey-900 bg-white font-bold'
                : 'text-grey-700 font-medium'
            }`}
            onClick={() => {
              setSlot(key)
              setSelected(null)
            }}
          >
            {key === 'fasting' ? '공복' : '식후'}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <p className="text-grey-600 text-sm leading-snug font-medium">
          {selectedDay
            ? `${monthDay(selectedDay.date)} (${WEEKDAYS[selectedDay.date.getDay()]}) · ${slotLabel} 평균`
            : `${slotLabel} 평균 · ${clipped ? `${monthDay(start)}부터` : periodLabel}`}
        </p>
        <p className="flex items-baseline gap-1">
          <span className="text-stat text-grey-900">
            {(selectedDay ? selectedDay.value : stats.average) ?? '—'}
          </span>
          <span className="text-body-2 text-grey-600">mg/dL</span>
        </p>
        <p className="text-grey-700 text-sm leading-snug font-bold whitespace-pre">
          {stats.count === 0
            ? `이 기간엔 ${slotLabel} 기록이 없어요`
            : selectedDay
              ? `그날 ${selectedDay.count}번 잼${
                  hasPrevious && previousDay?.value != null
                    ? ` · ${names.previous} 같은 때 ${previousDay.value}`
                    : ''
                }`
              : hasPrevious
                ? formatDelta(stats.average, previous.average)
                  ? `${formatDelta(stats.average, previous.average)}  ${names.previous} ${previous.average}`
                  : `${withAnd(names.previous)} 같아요  ${previous.average}`
                : `지난 기록이 쌓이면 ${withAnd(names.previous)} 비교해 드려요`}
        </p>
      </div>

      <div className="mt-4">
        {stats.count > 0 ? (
          <StatsChart
            current={stats.days}
            previous={hasPrevious ? previous.days : null}
            target={target}
            selected={selected}
            onSelect={(index) => setSelected(index === selected ? null : index)}
          />
        ) : (
          <div className="bg-grey-50 text-t7 text-grey-600 flex h-53 items-center justify-center rounded-2xl">
            기록이 쌓이면 그래프로 보여 드려요
          </div>
        )}
      </div>

      <div className="text-grey-600 mt-4 flex items-center gap-3.5 text-xs leading-normal font-medium">
        <span className="flex items-center gap-1.5">
          <span className="bg-primary h-0.5 w-4" />
          {names.current}
        </span>
        {hasPrevious && (
          <span className="flex items-center gap-1.5">
            <span className="border-grey-300 w-4 border-t-2 border-dashed" />
            {names.previous}
          </span>
        )}
      </div>

      <div className="mt-4 mb-5 flex justify-between">
        {PERIODS.map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={period === key}
            className={`rounded-tag px-3.5 py-2 text-sm leading-snug ${
              period === key ? 'bg-grey-100 text-grey-900 font-bold' : 'text-grey-600 font-medium'
            }`}
            onClick={() => changePeriod(key)}
          >
            {PERIOD_LABEL[key]}
          </button>
        ))}
      </div>

      <div className="bg-grey-100 -mx-5 h-2.5" />
      <Section
        title={hasPrevious ? `${withAnd(names.previous)} 비교` : '이번 기간'}
        description={
          hasPrevious
            ? `${withAnd(formatShortRange(previousRange))} ${period === '1w' ? '' : '같은 길이로 '}비교했어요`
            : `${monthDay(range.from)}부터 쌓인 기록이에요`
        }
      >
        {target !== null &&
          (slot === 'post-meal' ? (
            <StatRow
              title="내 기준 안"
              description={`${target} 미만으로 잰 비율`}
              value={stats.inRangeRate === null ? '—' : `${stats.inRangeRate}%`}
              note={compareNote(stats.inRangeRate, previous.inRangeRate, '%p', '%')}
              highlight
            />
          ) : (
            <StatRow
              title="내 기준 안"
              description={`${target} 미만으로 잰 날`}
              value={`${stats.inRangeDays}일 / ${stats.measuredDays}일`}
              note={compareNote(stats.inRangeDays, previous.inRangeDays, '일')}
              highlight
            />
          ))}
        <StatRow
          title="잰 횟수"
          value={`${stats.count}번`}
          note={compareNote(stats.count, previous.count, '번')}
        />
        <StatRow
          title="놓친 측정"
          description="알림 뒤 기록 없음"
          value={`${stats.missed}번`}
          note={compareNote(stats.missed, previous.missed, '번')}
        />
        {target !== null && (
          <StatRow
            title="기준 넘은 날"
            description={slot === 'post-meal' ? `한 번이라도 ${target} 이상` : `${target} 이상`}
            value={`${stats.overDays}일`}
            note={compareNote(stats.overDays, previous.overDays, '일')}
          />
        )}
      </Section>

      {slot === 'post-meal' && highestMeal && (
        <>
          <div className="bg-grey-100 -mx-5 h-2.5" />
          <Section
            title="때별 평균"
            description={`${MEAL_LABEL[highestMeal]} 식후가 가장 높았어요`}
          >
            {mealAverages.map((type) => (
              <StatRow
                key={type}
                title={`${MEAL_LABEL[type]} 식후`}
                value={String(stats.byMeal[type])}
                note={compareNote(stats.byMeal[type], previous.byMeal[type], '')}
              />
            ))}
          </Section>
        </>
      )}

      <p className="text-grey-600 text-xs leading-normal">
        {hasPrevious &&
          `${names.previous} = 바로 전 ${period === '1w' ? '7일' : '같은 길이 기간'}(${formatShortRange(previousRange)}). `}
        {criteriaChanged && '병원 기준이 바뀐 날부터는 새 기준으로 셌어요. '}
        숫자의 뜻은 진료에서 확인해 주세요.
      </p>

      {rangeSheet && (
        <RangeSheet
          today={today}
          start={start}
          initial={custom}
          onApply={(next) => {
            setCustom(next)
            setPeriod('custom')
            setRangeSheet(false)
          }}
          onClose={closeRangeSheet}
        />
      )}
    </main>
  )
}

export default StatsPage
