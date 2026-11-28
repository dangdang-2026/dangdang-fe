import { MEAL_ORDER } from '@/constants/glucose'
import type { Criteria, MeasureSlotKey } from '@/types/criteria'
import type { GlucoseRecord, InsulinRecord, Meal, MeasureSlot, MealType } from '@/types/glucose'
import { formatDuration, getCriteriaAt } from '@/utils/criteria'
import { addDays, isSameDay, startOfDay, toDateKey } from '@/utils/date'
import {
  isAboveTarget,
  getLateMinutes,
  getSlotLabel,
  getTarget,
  type Targets,
} from '@/utils/glucose'

// 예: 식후 1시간 140 미만 · 공복 95 미만. 적은 목표가 없으면 null
export function formatCriteria(targets: Targets, postMealHours: number | null) {
  const parts: string[] = []
  if (targets.postMeal !== null && postMealHours) {
    parts.push(`식후 ${formatDuration(postMealHours)} ${targets.postMeal} 미만`)
  }
  if (targets.fasting !== null) parts.push(`공복 ${targets.fasting} 미만`)
  return parts.length ? parts.join(' · ') : null
}

const HOUR = 60 * 60 * 1000
// 측정 후 30분 넘어 적으면 나중 입력(서버 enteredLate · 피그마 리포트 안내와 같음)
const LATE_ENTRY_MS = HOUR / 2
// 저혈당 확인 기준(mg/dL)
export const LOW_GLUCOSE = 70
// 높은 값 확인 기준(mg/dL). HI도 여기
export const HIGH_GLUCOSE = 200

type SlotKey = MeasureSlotKey

// 서버 리포트의 빈칸(놓친 측정 알림 · 건너뛴 끼니). 기기엔 알림 기록이 없어 서버 값으로 덮음
export type ReportMissed = {
  total: number
  bySlot: Partial<Record<SlotKey, number>>
  // 'yyyy-MM-dd|잴 때' 칸마다 「–」
  cells: Set<string>
}

export const missedCellKey = (date: Date, key: SlotKey) => `${toDateKey(date)}|${key}`

// 서버 리포트 본문. 목표 밖 · 늦게 잼은 서버 판정, 나중 입력은 서버 enteredLate
export type ServerReport = {
  records: GlucoseRecord[]
  lateEntryIds: Set<string>
  // 서버 잴 때가 없는 기록(끼니와 안 이어진 식후 등). 시점별 숫자에 없어 표에서도 뺌
  unslottedIds: Set<string>
  measured: number
  lateEntries: number
  // 잴 때별 측정 · 목표 밖(그때 기준으로 서버가 셈)
  slotCounts: Partial<Record<SlotKey, { measured: number; outOfTarget: number }>>
  insulins: InsulinRecord[]
}

// 리포트 표의 열 순서
const SLOT_KEYS: SlotKey[] = ['fasting', ...MEAL_ORDER, 'bedtime']

function getSlotKey(record: GlucoseRecord): SlotKey {
  if (record.slot === 'post-meal') return record.mealType ?? 'lunch'
  return record.slot
}

function toMeasureSlot(key: SlotKey): { slot: MeasureSlot; mealType?: MealType } {
  if (key === 'fasting' || key === 'bedtime') return { slot: key }
  return { slot: 'post-meal', mealType: key }
}

export function isLateEntry(record: GlucoseRecord) {
  if (!record.enteredAt) return false
  return (
    new Date(record.enteredAt).getTime() - new Date(record.measuredAt).getTime() > LATE_ENTRY_MS
  )
}

export type ReportCell = {
  record: GlucoseRecord
  isOutOfTarget: boolean
  // 측정 뒤 30분 넘어 적음. 표에 * 표시
  lateEntry: boolean
  // 표에 붙일 표시: 늦게 잼(n분 늦게)·수정됨
  marks: string[]
}

// 서버가 늦게 쟀다고 본(LATE) 기록의 늦은 분
function serverLateMinutes(record: GlucoseRecord) {
  if (record.timing !== 'LATE' || !record.expectedAt) return 0
  return Math.round(
    (new Date(record.measuredAt).getTime() - new Date(record.expectedAt).getTime()) / 60000,
  )
}

export type Report = {
  from: Date
  to: Date
  measured: number
  blanks: number
  lateEntries: number
  // 목표가 없는 시점은 outOfTarget이 null(비교 안 함)
  // missed: 그 잴 때 빈칸 수
  slots: {
    key: SlotKey
    label: string
    outOfTarget: number | null
    total: number
    missed: number
    // 목표 밖 값(원값 그대로)
    outValues: GlucoseRecord[]
  }[]
  days: { date: Date; cells: Partial<Record<SlotKey, ReportCell>> }[]
  // 원값 표에서 「–」로 보일 빈칸
  missedCells: Set<string>
  lows: GlucoseRecord[]
  highs: GlucoseRecord[]
  // 원값 표 · 인슐린(맞은 시각 순). 서버 리포트만
  insulins: InsulinRecord[]
}

type BuildReportParams = {
  records: GlucoseRecord[]
  meals: Meal[]
  from: Date
  to: Date
  // 기준 버전 전체. 기록마다 그 날짜의 기준으로 비교
  versions: Criteria[]
  // 서버 리포트 빈칸. 없으면(기간 직접 · 서버 못 받음) 기록 있는 날 빠진 잴 때를 빈칸으로
  missed?: ReportMissed | null
  // 서버 리포트 본문. 있으면 기기 기록 대신 서버 원값 · 판정으로
  server?: ServerReport | null
}

// 기간 기록을 시점별로 모음. 해석 없이 개수·원값만
export function buildReport({
  records,
  meals,
  from,
  to,
  versions,
  missed,
  server,
}: BuildReportParams): Report {
  // 시점 이름·목표 유무는 리포트 마지막 날 기준
  const { targets, postMealHours } = getCriteriaAt(versions, startOfDay(to))
  const start = startOfDay(from)
  const end = addDays(startOfDay(to), 1)
  // 서버 원값엔 고쳤는지가 없어 기기에 있는 같은 기록의 고친 시각을 붙임
  const localById = new Map(records.map((record) => [record.id, record]))
  const source = server
    ? server.records.map((record) => ({
        ...record,
        editedAt: localById.get(record.id)?.editedAt,
      }))
    : records
  // 기간 안 전체 기록. 70 미만 · 200 이상은 잴 때를 몰라도 셈
  const allInRange = source
    .filter((record) => {
      const at = new Date(record.measuredAt)
      return at >= start && at < end
    })
    .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
  // 표 · 시점별 숫자용. 서버 잴 때가 없는 기록은 시점별 숫자에 없어 뺌
  const inRange = server
    ? allInRange.filter((record) => !server.unslottedIds.has(record.id))
    : allInRange

  const toCell = (record: GlucoseRecord): ReportCell => {
    const criteria = getCriteriaAt(versions, new Date(record.measuredAt))
    const goal = getTarget(record.slot, criteria.targets, criteria.postMealHours)
    const marks: string[] = []
    const late = server
      ? serverLateMinutes(record)
      : getLateMinutes(record, meals, criteria.postMealHours)
    if (late > 0) marks.push(server ? `늦게 잼 · ${late}분 늦게` : '늦게 잼')
    if (record.editedAt) marks.push('수정됨')
    return {
      record,
      // 서버 리포트는 그때 기준으로 서버가 판정한 값
      isOutOfTarget: server ? record.aboveTarget === true : isAboveTarget(record, goal),
      lateEntry: server ? server.lateEntryIds.has(record.id) : isLateEntry(record),
      marks,
    }
  }

  const days: Report['days'] = []
  for (let date = start; date < end; date = addDays(date, 1)) {
    const cells: Report['days'][number]['cells'] = {}
    // 같은 시점을 두 번 쟀으면 나중 값
    for (const record of inRange.filter((item) => isSameDay(new Date(item.measuredAt), date))) {
      cells[getSlotKey(record)] = toCell(record)
    }
    days.push({ date, cells })
  }

  // 빈칸: 서버가 주면 놓친 측정 알림 그대로, 없으면 기록 있는 날 그날 기준의 재는 때 중 빠진 칸
  const missedCells =
    missed?.cells ??
    new Set(
      days
        .filter((day) => Object.keys(day.cells).length > 0)
        .flatMap((day) =>
          getCriteriaAt(versions, day.date)
            .measureSlots.filter((key) => !day.cells[key])
            .map((key) => missedCellKey(day.date, key)),
        ),
    )
  const countMissed = (key: SlotKey) =>
    missed?.bySlot[key] ?? [...missedCells].filter((cell) => cell.endsWith(`|${key}`)).length

  const slots = SLOT_KEYS.map((key) => {
    // 하루에 두 번 잰 것까지 전부. 표는 나중 값만 보여도 숫자 · 목표 밖 값은 서버 집계와 같게
    const cells = inRange.filter((record) => getSlotKey(record) === key).map(toCell)
    const { slot, mealType } = toMeasureSlot(key)
    const counted = server?.slotCounts[key]
    const judged = cells.some((cell) => cell.record.aboveTarget != null)
    // 서버 리포트는 그때 기준으로 판정한 기록이 있으면 비교한 것(기기에 기준을 아직 못 받아도)
    const hasTarget = server
      ? counted
        ? counted.outOfTarget > 0 || judged
        : judged
      : getTarget(slot, targets, postMealHours) !== null
    const out = cells.filter((cell) => cell.isOutOfTarget)
    return {
      key,
      label: getSlotLabel(slot, mealType, postMealHours),
      outOfTarget: hasTarget ? (counted?.outOfTarget ?? out.length) : null,
      total: counted?.measured ?? cells.length,
      missed: countMissed(key),
      outValues: out.map((cell) => cell.record),
    }
  }).filter((slot) => slot.key !== 'bedtime' || slot.total > 0 || slot.missed > 0)

  return {
    from: start,
    to: startOfDay(to),
    measured: server?.measured ?? inRange.length,
    blanks: missed?.total ?? missedCells.size,
    lateEntries: server?.lateEntries ?? inRange.filter(isLateEntry).length,
    slots,
    // 기록이나 빈칸이 있는 날만 표에
    days: days.filter(
      (day) =>
        Object.keys(day.cells).length > 0 ||
        SLOT_KEYS.some((key) => missedCells.has(missedCellKey(day.date, key))),
    ),
    missedCells,
    lows: allInRange.filter((record) => record.value < LOW_GLUCOSE),
    highs: allInRange.filter((record) => record.value >= HIGH_GLUCOSE),
    insulins: server?.insulins ?? [],
  }
}

type ReportTextParams = {
  report: Report
  title: string
  periodLabel: string
  criteriaLines: string[]
  questions: { text: string }[]
}

// 공유용 글. 메신저·메일에 붙여도 읽히게 줄글로
export function formatReportText({
  report,
  title,
  periodLabel,
  criteriaLines,
  questions,
}: ReportTextParams) {
  const slotLines = report.slots.map(
    (slot) => `- ${slot.label}: ${slot.outOfTarget ?? '–'} / ${slot.total}`,
  )
  const questionLines = questions.map((question, index) => `${index + 1}. ${question.text}`)
  return [
    `[${title}] ${periodLabel}`,
    ...criteriaLines,
    '',
    `측정 ${report.measured} · 빈칸 ${report.blanks} · 나중 입력 ${report.lateEntries}`,
    '시점별 목표 밖 / 측정',
    ...slotLines,
    `70 미만: ${report.lows.length ? `${report.lows.length}번` : '없음'}`,
    ...(questionLines.length ? ['', '물어볼 것', ...questionLines] : []),
    '',
    '해석이나 권고 없이 기록만 담았어요',
  ].join('\n')
}

export const REPORT_SLOT_KEYS = SLOT_KEYS
export type { SlotKey }
