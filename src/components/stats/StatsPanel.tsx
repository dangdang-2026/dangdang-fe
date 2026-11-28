import { useCallback, useState, type ReactNode } from 'react'
import RangeSheet from '@/components/stats/RangeSheet'
import StatsChart from '@/components/stats/StatsChart'
import { MEAL_LABEL, MEAL_ORDER } from '@/constants/glucose'
import { useCriteria } from '@/hooks/useCriteria'
import { useReadingStats } from '@/hooks/useReadingStats'
import { useRecordStart } from '@/hooks/useRecordStart'
import { useCriteriaStore } from '@/stores/useCriteriaStore'
import { countCriteriaChanges, formatDuration, getCriteriaAt } from '@/utils/criteria'
import { addDays } from '@/utils/date'
import {
  PERIOD_DAYS,
  PERIOD_LABEL,
  PERIOD_NAMES,
  formatCompare,
  formatRangeLabel,
  formatShortRange,
  getPreviousRange,
  withAnd,
  type DateRange,
  type DayPoint,
  type PeriodStats,
  type StatsPeriod,
  type StatsSlot,
} from '@/utils/stats'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const PERIODS: StatsPeriod[] = ['1w', '2w', '1m', '3m', 'custom']
const DAY_MS = 24 * 60 * 60 * 1000

// 서버 통계를 받기 전·실패했을 때 쓰는 빈 값
const EMPTY_STATS: PeriodStats = {
  days: [],
  average: null,
  count: 0,
  inRangeRate: null,
  inRangeDays: 0,
  measuredDays: 0,
  missed: 0,
  overDays: 0,
  judged: 0,
  inTarget: 0,
  belowLow: 0,
  byMeal: { breakfast: null, lunch: null, dinner: null },
}

const monthDay = (date: Date) => `${date.getMonth() + 1}월 ${date.getDate()}일`

// 첫 기록과 마지막 기록 사이에서 기록이 없는 날. 선이 끊긴 날
function gapDays(days: DayPoint[]) {
  const first = days.findIndex((day) => day.value !== null)
  const last = days.findLastIndex((day) => day.value !== null)
  if (first < 0) return []
  return days.slice(first, last + 1).filter((day) => day.value === null)
}

// 예: 10월 11일은 기록이 없어서 선을 끊었어요
function formatGapNote(gaps: DayPoint[]) {
  if (gaps.length === 0) return null
  if (gaps.length > 2) return '기록이 없는 날은 선을 끊었어요.'
  return `${gaps.map((day) => monthDay(day.date)).join(' · ')}은 기록이 없어서 선을 끊었어요.`
}

type RowProps = {
  title: string
  description?: string
  value: string
  // 값 뒤 작은 글자. 예: (86번 중 71번) · / 6일
  sub?: string
  // 지난 기간과 비교 한 줄. 비교할 기록이 없으면 없음
  note?: string | null
}

function StatRow({ title, description, value, sub, note }: RowProps) {
  return (
    <li className="border-grey-100 flex items-center justify-between border-t py-3.5 first:border-t-0">
      <div className="flex flex-col gap-0.5">
        <p className="text-body-2 text-grey-800">{title}</p>
        {description && <p className="text-grey-600 text-xs leading-normal">{description}</p>}
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <p className="text-grey-900">
          <span className="text-subtitle-1">{value}</span>
          {sub && <span className="text-body-3 text-grey-600"> {sub}</span>}
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
        <p className="text-t7 text-grey-600 whitespace-pre-line">{description}</p>
      </div>
      <ul className="flex flex-col">{children}</ul>
    </section>
  )
}

type StatsPanelProps = {
  today: Date
}

// Figma D-17~D-21 혈당 통계. 기록 화면 「통계」 탭. 지난 같은 길이 기간과 비교만, 판단은 하지 않음
function StatsPanel({ today }: StatsPanelProps) {
  const start = useRecordStart(today)
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
  // 기록 시작 전 날은 빼고 보내서, 잘린 기간이면 서버 비교 기간은 쓰지 않음
  const { status, data } = useReadingStats(slot, range)
  const stats = data?.current ?? EMPTY_STATS
  const previous = data?.previous ?? EMPTY_STATS
  const hasPrevious = !clipped && !!data?.previous
  // 「…부터 쌓인 기록」은 서버 첫 기록일(다른 기기 기록 포함)이 보는 기간 안이면 그날부터
  const firstDay =
    data?.firstRecordDate && data.firstRecordDate > range.from ? data.firstRecordDate : range.from
  const loadMessage =
    status === 'loading'
      ? '통계를 불러오고 있어요'
      : status === 'error'
        ? '통계를 불러오지 못했어요'
        : null
  const names = PERIOD_NAMES[period]

  const targetOf = (date: Date) => {
    // 기준이 바뀐 날부터 새 기준. 그날 끝 시각으로 봄
    const version = versions.length
      ? getCriteriaAt(versions, new Date(date.getTime() + DAY_MS - 1))
      : null
    if (!version) return null
    if (slot === 'fasting') return version.targets.fasting
    return version.postMealHours ? version.targets.postMeal : null
  }
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
        ? `식후 ${formatDuration(criteria.postMealHours)}`
        : '식후'
  const periodText = clipped
    ? `${monthDay(start)}부터`
    : period === 'custom' && custom
      ? formatRangeLabel(custom)
      : `최근 ${PERIOD_LABEL[period]}`
  const previousLabel = formatShortRange(previousRange)

  const selectedDay = selected !== null ? stats.days[selected] : null
  const previousDay = selected !== null ? previous.days[selected] : null
  const dayTargets = stats.days.map((day) => targetOf(day.date))
  const hasBand = dayTargets.some((value) => value !== null)

  const compare = (
    current: number | null,
    before: number | null,
    kind: Parameters<typeof formatCompare>[3],
    unit = '',
  ) => (hasPrevious ? formatCompare(current, before, names.previous, kind, unit) : null)

  // 예: 지난달보다 6 mg/dL 낮아요 · 지난달 133
  const headline = () => {
    if (loadMessage) return loadMessage
    if (stats.count === 0) return `이 기간엔 ${slotLabel} 기록이 없어요`
    if (selectedDay) {
      const same =
        hasPrevious && previousDay?.value != null
          ? ` · ${names.previous} 같은 때 ${previousDay.value} mg/dL`
          : ''
      return `그날 ${selectedDay.count}번 쟀어요${same}`
    }
    if (!hasPrevious) return `지난 기록이 쌓이면 ${withAnd(names.previous)} 비교해 드려요`
    const delta = formatCompare(
      stats.average,
      previous.average,
      names.previous,
      'glucose',
      ' mg/dL',
    )
    return `${delta} · ${names.previous} ${previous.average ?? '—'}`
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
  const gapNote = stats.count > 0 ? formatGapNote(gapDays(stats.days)) : null
  const footnote = [
    hasPrevious &&
      `${names.previous} = 바로 전 ${period === '1w' ? '7일' : '같은 길이 기간'}(${previousLabel}).`,
    criteriaChanged && '병원 기준이 바뀐 날부터는 새 기준으로 셌어요.',
    gapNote,
    '숫자의 뜻은 진료에서 확인해 주세요.',
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <div className="break-keep">
      <div className="flex gap-2">
        {(['fasting', 'post-meal'] as StatsSlot[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={slot === key}
            className={`rounded-full border px-4 py-1.5 text-sm leading-snug ${
              slot === key
                ? 'bg-grey-900 border-grey-900 font-bold text-white'
                : 'border-grey-200 text-grey-700 bg-white font-medium'
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

      <div className="mt-5 flex flex-col gap-1">
        <p className="text-grey-600 text-sm leading-snug font-medium">
          {selectedDay
            ? `${monthDay(selectedDay.date)} (${WEEKDAYS[selectedDay.date.getDay()]}) · ${slotLabel} 평균`
            : `${slotLabel} 평균 · ${periodText}`}
        </p>
        <p className="flex items-baseline gap-1">
          <span className="text-stat text-grey-900">
            {(selectedDay ? selectedDay.value : stats.average) ?? '—'}
          </span>
          <span className="text-body-2 text-grey-600">mg/dL</span>
        </p>
        <p className="text-grey-700 text-sm leading-snug font-medium">{headline()}</p>
      </div>

      <div className="mt-4 flex justify-between">
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
            {key === 'custom' ? '기간 선택' : PERIOD_LABEL[key]}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {stats.count > 0 ? (
          <>
            <p className="text-grey-600 text-caption mb-2 font-medium">mg/dL</p>
            <StatsChart
              current={stats.days}
              previous={hasPrevious ? previous.days : null}
              targets={dayTargets}
              selected={selected}
              onSelect={(index) => setSelected(index === selected ? null : index)}
            />
          </>
        ) : (
          <div className="bg-grey-50 text-t7 text-grey-600 flex h-53 items-center justify-center rounded-2xl">
            {loadMessage ?? '기록이 쌓이면 그래프로 보여 드려요'}
          </div>
        )}
      </div>

      <div className="text-grey-600 mt-4 mb-6 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs leading-normal font-medium">
        <span className="flex items-center gap-1.5">
          <span className="bg-primary h-0.5 w-4" />
          {names.current}
        </span>
        {hasPrevious && (
          <span className="flex items-center gap-1.5">
            <span className="border-grey-300 w-4 border-t-2 border-dotted" />
            {names.previous}({previousLabel})
          </span>
        )}
        {stats.count > 0 && hasBand && (
          <span className="flex items-center gap-1.5">
            <span className="bg-grey-100 border-grey-300 h-2.5 w-3.5 rounded-xs border" />
            병원 기준 안
          </span>
        )}
      </div>

      {status === 'done' && (
        <>
          <div className="bg-grey-100 -mx-5 h-2.5" />
          <Section
            title={hasPrevious ? `${withAnd(names.previous)} 비교` : '이번 기간'}
            description={
              hasPrevious
                ? `${withAnd(previousLabel)} ${period === '1w' ? '' : '같은 길이로 '}비교했어요`
                : `${monthDay(firstDay)}부터 쌓인 기록이에요`
            }
          >
            {target !== null &&
              (slot === 'post-meal' ? (
                <StatRow
                  title="병원 기준 안"
                  description={`${target} 미만으로 잰 비율`}
                  value={stats.inRangeRate === null ? '—' : `${stats.inRangeRate}%`}
                  sub={
                    stats.inRangeRate === null
                      ? undefined
                      : `(${stats.judged}번 중 ${stats.inTarget}번)`
                  }
                  note={compare(stats.inRangeRate, previous.inRangeRate, 'rate')}
                />
              ) : (
                <StatRow
                  title="병원 기준 안"
                  description={`${target} 미만으로 잰 날`}
                  value={`${stats.inRangeDays}일`}
                  sub={`/ ${stats.measuredDays}일`}
                  note={compare(stats.inRangeDays, previous.inRangeDays, 'day', '일')}
                />
              ))}
            <StatRow
              title="잰 횟수"
              value={`${stats.count}번`}
              note={compare(stats.count, previous.count, 'count', '번')}
            />
            <StatRow
              title="알림 뒤 기록 안 됨"
              description="알림을 받고 기록하지 않은 때"
              value={`${stats.missed}번`}
              note={compare(stats.missed, previous.missed, 'count', '번')}
            />
            {target !== null && (
              <StatRow
                title="기준 넘은 날"
                description={slot === 'post-meal' ? `한 번이라도 ${target} 이상` : `${target} 이상`}
                value={`${stats.overDays}일`}
                note={compare(stats.overDays, previous.overDays, 'day', '일')}
              />
            )}
            <StatRow
              title="70 미만"
              description="낮게 잰 횟수"
              value={stats.belowLow === 0 ? '없어요' : `${stats.belowLow}번`}
              note={compare(stats.belowLow, previous.belowLow, 'count', '번')}
            />
          </Section>

          {slot === 'post-meal' && highestMeal && (
            <>
              <div className="bg-grey-100 -mx-5 h-2.5" />
              <Section
                title="때별 평균 (mg/dL)"
                description={`${slotLabel} · ${periodText}\n${MEAL_LABEL[highestMeal]} 식후가 가장 높았어요`}
              >
                {mealAverages.map((type) => (
                  <StatRow
                    key={type}
                    title={`${MEAL_LABEL[type]} 식후`}
                    value={String(stats.byMeal[type])}
                    note={compare(stats.byMeal[type], previous.byMeal[type], 'glucose')}
                  />
                ))}
              </Section>
            </>
          )}
        </>
      )}

      <p className="text-grey-600 mt-4 text-xs leading-normal whitespace-pre-line">{footnote}</p>

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
    </div>
  )
}

export default StatsPanel
