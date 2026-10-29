import { CHAT_INFOS, DRAFT_KEYWORDS, RECORDS_KEYWORDS, RISK_KEYWORDS } from '@/constants/chat'
import type { RecordsSummary } from '@/types/chat'
import type { Criteria, MeasureSlotKey } from '@/types/criteria'
import type { GlucoseRecord } from '@/types/glucose'
import { MEASURE_SLOT_LABEL } from '@/utils/criteria'
import { addDays, isSameDay, startOfDay } from '@/utils/date'
import { compareToTarget } from '@/utils/glucose'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export type ChatIntent = 'risk' | 'draft' | 'info' | 'records' | 'unknown'

const includesAny = (text: string, keywords: string[]) =>
  keywords.some((keyword) => text.includes(keyword))

export function findInfo(text: string) {
  return CHAT_INFOS.find((info) =>
    info.keywords.some((group) => group.every((keyword) => text.includes(keyword))),
  )
}

// 위험 신호가 가장 먼저. 그다음 정리 > 일반 정보 > 기록
export function classifyQuestion(text: string): ChatIntent {
  if (includesAny(text, RISK_KEYWORDS)) return 'risk'
  if (includesAny(text, DRAFT_KEYWORDS)) return 'draft'
  if (findInfo(text)) return 'info'
  if (includesAny(text, RECORDS_KEYWORDS)) return 'records'
  return 'unknown'
}

// 질문에 적힌 측정 시점. 없으면 null
export function detectSlot(text: string): MeasureSlotKey | null {
  if (text.includes('공복')) return 'fasting'
  if (text.includes('아침')) return 'breakfast'
  if (text.includes('점심')) return 'lunch'
  if (text.includes('저녁')) return 'dinner'
  if (text.includes('자기 전') || text.includes('취침')) return 'bedtime'
  return null
}

function matchesSlot(record: GlucoseRecord, slot: MeasureSlotKey) {
  if (slot === 'fasting' || slot === 'bedtime') return record.slot === slot
  return record.slot === 'post-meal' && record.mealType === slot
}

function getSlotTarget(slot: MeasureSlotKey, criteria: Criteria) {
  if (slot === 'fasting') return criteria.targets.fasting
  if (slot === 'bedtime') return null
  // 식후 측정 시점을 모르면 비교 안 함
  return criteria.postMealHours ? criteria.targets.postMeal : null
}

const formatShortDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`

// 오늘까지 7일, 하루 한 칸. 같은 날 여러 번이면 마지막 값
export function summarizeRecords(
  records: GlucoseRecord[],
  criteria: Criteria,
  slot: MeasureSlotKey,
  now: Date,
): RecordsSummary {
  const from = addDays(startOfDay(now), -6)
  const target = getSlotTarget(slot, criteria)
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(from, index)
    const record = records
      .filter((item) => matchesSlot(item, slot) && isSameDay(new Date(item.measuredAt), day))
      .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())
      .at(-1)
    const value = record?.value ?? null
    return {
      weekday: WEEKDAYS[day.getDay()],
      value,
      high: value !== null && compareToTarget(value, target) === 'high',
    }
  })
  const measured = days.filter((day) => day.value !== null).length
  const hoursLabel =
    slot !== 'fasting' && slot !== 'bedtime' && criteria.postMealHours
      ? ` ${criteria.postMealHours}시간`
      : ''

  return {
    slot,
    label: `${MEASURE_SLOT_LABEL[slot]}${hoursLabel}`,
    range: `${formatShortDate(from)}~${formatShortDate(now)}`,
    target,
    measured,
    high: days.filter((day) => day.high).length,
    missing: 7 - measured,
    days,
  }
}

// 시점을 말하지 않았으면 목표보다 높은 날이 가장 많은 시점
export function pickDefaultSlot(records: GlucoseRecord[], criteria: Criteria, now: Date) {
  const slots: MeasureSlotKey[] = criteria.measureSlots.length ? criteria.measureSlots : ['dinner']
  return slots
    .map((slot) => summarizeRecords(records, criteria, slot, now))
    .reduce((best, item) => (item.high > best.high ? item : best)).slot
}

// 물어볼 말 초안. 기록 동의가 없으면 숫자 없이
export function buildDraft(summary: RecordsSummary | null) {
  const ending = '다음 진료 전에 연락해야 하는 경우도 알려 주세요.'
  if (!summary || summary.measured === 0) {
    return `혈당을 재는 방법이나 식사에서 바꿔야 할 점이 있을까요? ${ending}`
  }
  if (summary.target !== null && summary.high > 0) {
    return `지난 7일 ${summary.label} 혈당이 ${summary.measured}번 잰 것 중 ${summary.high}번 ${summary.target} 이상이었어요. 식사나 측정 방법을 바꿔야 할까요? ${ending}`
  }
  return `지난 7일 ${summary.label} 혈당을 ${summary.measured}번 쟀어요. 지금처럼 재면 될까요? ${ending}`
}

// 병원에 가야 하는지 물으면 판단할 수 없다고 먼저 말함
export function buildDraftIntro(question: string) {
  const ask = '이렇게 물어보시면 어떨까요? 고쳐서 쓰셔도 돼요.'
  return includesAny(question, ['병원에 가야', '가야 하', '괜찮'])
    ? `병원에 가야 하는지는 제가 판단할 수 없어요. ${ask}`
    : ask
}
