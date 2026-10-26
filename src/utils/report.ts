import { MEAL_ORDER } from '@/constants/glucose'
import type { Criteria, MeasureSlotKey } from '@/types/criteria'
import type { GlucoseRecord, Meal, MeasureSlot, MealType } from '@/types/glucose'
import { getCriteriaAt } from '@/utils/criteria'
import { addDays, isSameDay, startOfDay } from '@/utils/date'
import {
  compareToTarget,
  getLateMinutes,
  getSlotLabel,
  getTarget,
  type Targets,
} from '@/utils/glucose'

// 예: 식후 1시간 140 미만 · 공복 95 미만. 적은 목표가 없으면 null
export function formatCriteria(targets: Targets, postMealHours: number | null) {
  const parts: string[] = []
  if (targets.postMeal !== null && postMealHours) {
    parts.push(`식후 ${postMealHours}시간 ${targets.postMeal} 미만`)
  }
  if (targets.fasting !== null) parts.push(`공복 ${targets.fasting} 미만`)
  return parts.length ? parts.join(' · ') : null
}

const HOUR = 60 * 60 * 1000
// 측정 후 2시간 넘어 적으면 나중 입력
const LATE_ENTRY_MS = 2 * HOUR
// 저혈당 확인 기준(mg/dL)
export const LOW_GLUCOSE = 70

type SlotKey = MeasureSlotKey

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
  // 표에 붙일 표시: 늦게 잼·나중 입력·수정됨
  marks: string[]
}

export type Report = {
  from: Date
  to: Date
  measured: number
  blanks: number
  lateEntries: number
  // 목표가 없는 시점은 outOfTarget이 null(비교 안 함)
  slots: { key: SlotKey; label: string; outOfTarget: number | null; total: number }[]
  days: { date: Date; cells: Partial<Record<SlotKey, ReportCell>> }[]
  lows: GlucoseRecord[]
}

type BuildReportParams = {
  records: GlucoseRecord[]
  meals: Meal[]
  from: Date
  to: Date
  // 기준 버전 전체. 기록마다 그 날짜의 기준으로 비교
  versions: Criteria[]
}

// 기간 기록을 시점별로 모음. 해석 없이 개수·원값만
export function buildReport({ records, meals, from, to, versions }: BuildReportParams): Report {
  // 시점 이름·목표 유무는 리포트 마지막 날 기준
  const { targets, postMealHours } = getCriteriaAt(versions, startOfDay(to))
  const start = startOfDay(from)
  const end = addDays(startOfDay(to), 1)
  const inRange = records
    .filter((record) => {
      const at = new Date(record.measuredAt)
      return at >= start && at < end
    })
    .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))

  const toCell = (record: GlucoseRecord): ReportCell => {
    const criteria = getCriteriaAt(versions, new Date(record.measuredAt))
    const goal = getTarget(record.slot, criteria.targets, criteria.postMealHours)
    const marks: string[] = []
    if (getLateMinutes(record, meals, criteria.postMealHours) > 0) marks.push('늦게 잼')
    if (isLateEntry(record)) marks.push('나중 입력')
    if (record.editedAt) marks.push('수정됨')
    return { record, isOutOfTarget: compareToTarget(record.value, goal) === 'high', marks }
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

  const slots = SLOT_KEYS.map((key) => {
    const cells = days.flatMap((day) => (day.cells[key] ? [day.cells[key]] : []))
    const { slot, mealType } = toMeasureSlot(key)
    const hasTarget = getTarget(slot, targets, postMealHours) !== null
    return {
      key,
      label: getSlotLabel(slot, mealType, postMealHours),
      outOfTarget: hasTarget ? cells.filter((cell) => cell.isOutOfTarget).length : null,
      total: cells.length,
    }
  }).filter((slot) => slot.key !== 'bedtime' || slot.total > 0)

  // 기록이 하나라도 있는 날, 그날 기준의 재는 때 중 빠진 칸
  const blanks = days
    .filter((day) => Object.keys(day.cells).length > 0)
    .reduce(
      (sum, day) =>
        sum +
        getCriteriaAt(versions, day.date).measureSlots.filter((key) => !day.cells[key]).length,
      0,
    )

  return {
    from: start,
    to: startOfDay(to),
    measured: inRange.length,
    blanks,
    lateEntries: inRange.filter(isLateEntry).length,
    slots,
    days: days.filter((day) => Object.keys(day.cells).length > 0),
    lows: inRange.filter((record) => record.value < LOW_GLUCOSE),
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
