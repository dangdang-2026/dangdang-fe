import type { RecordsSummary, ServerRecordsCard } from '@/types/chat'
import type { Criteria, MeasureSlotKey } from '@/types/criteria'
import { MEASURE_SLOT_LABEL, formatDuration } from '@/utils/criteria'
import { addDays, diffInDays, isSameDay, parseDateKey } from '@/utils/date'
import { compareToTarget } from '@/utils/glucose'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 물어볼 말로 직접 정리할 때 첫 말풍선
export const DRAFT_INTRO = '이렇게 물어보시면 어떨까요? 고쳐서 쓰셔도 돼요.'

// 백엔드 MeasureSlot → 화면 측정 시점
const SLOT_FROM_SERVER: Record<string, MeasureSlotKey> = {
  FASTING: 'fasting',
  BREAKFAST_AFTER: 'breakfast',
  LUNCH_AFTER: 'lunch',
  DINNER_AFTER: 'dinner',
  BEDTIME: 'bedtime',
}

function getSlotTarget(slot: MeasureSlotKey | null, criteria: Criteria) {
  if (slot === null || slot === 'bedtime') return null
  if (slot === 'fasting') return criteria.targets.fasting
  // 식후 측정 시점을 모르면 비교 안 함
  return criteria.postMealHours ? criteria.targets.postMeal : null
}

const formatShortDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`

// 서버 기록 카드 → 화면 카드. 목표는 내가 적은 병원 기준으로만 비교하고 괜찮은지는 말하지 않음
export function summarizeServerCard(card: ServerRecordsCard, criteria: Criteria): RecordsSummary {
  const slot = card.slot ? (SLOT_FROM_SERVER[card.slot] ?? null) : null
  const from = parseDateKey(card.from) ?? new Date()
  const to = parseDateKey(card.to) ?? from
  const dayCount = diffInDays(from, to) + 1
  const target = getSlotTarget(slot, criteria)
  const isHigh = (value: number) => compareToTarget(value, target) === 'high'
  const hoursLabel =
    slot && slot !== 'fasting' && slot !== 'bedtime' && criteria.postMealHours
      ? ` ${formatDuration(criteria.postMealHours)}`
      : ''

  // 한 시점 · 7일 이하면 하루 한 칸. 같은 날 여러 번이면 마지막 값
  const days =
    slot && dayCount <= 7
      ? Array.from({ length: dayCount }, (_, index) => {
          const day = addDays(from, index)
          const value =
            card.items.filter((item) => isSameDay(new Date(item.measuredAt), day)).at(-1)?.value ??
            null
          return { weekday: WEEKDAYS[day.getDay()], value, high: value !== null && isHigh(value) }
        })
      : []

  return {
    slot,
    label: slot ? `${MEASURE_SLOT_LABEL[slot]}${hoursLabel}` : '전체',
    range: `${formatShortDate(from)}~${formatShortDate(to)}`,
    target,
    measured: card.count,
    high: card.items.filter((item) => isHigh(item.value)).length,
    missing: days.filter((day) => day.value === null).length,
    days,
  }
}
