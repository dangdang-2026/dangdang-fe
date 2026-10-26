import type { Criteria, MeasureSlotKey } from '@/types/criteria'

// 그 날짜에 적용되던 기준. 적용 전 날짜면 첫 버전
export function getCriteriaAt(versions: Criteria[], date: Date) {
  const applied = versions.filter((item) => new Date(item.appliedFrom) <= date)
  return applied.at(-1) ?? versions[0]
}

// 기간 안에서 기준이 바뀐 횟수(시작일 다음 날부터 마지막 날까지 새로 적용된 버전 수)
export function countCriteriaChanges(versions: Criteria[], from: Date, to: Date) {
  return versions.filter((item) => {
    const applied = new Date(item.appliedFrom)
    return applied > from && applied <= to
  }).length
}

export function getCurrentCriteria(versions: Criteria[]) {
  return versions[versions.length - 1]
}

export const MEASURE_SLOT_LABEL: Record<MeasureSlotKey, string> = {
  fasting: '공복',
  breakfast: '아침 식후',
  lunch: '점심 식후',
  dinner: '저녁 식후',
  bedtime: '자기 전',
}

export const MEASURE_SLOT_ORDER: MeasureSlotKey[] = [
  'fasting',
  'breakfast',
  'lunch',
  'dinner',
  'bedtime',
]

// 예: 140 미만 / 비교 안 함
export function formatTarget(value: number | null) {
  return value === null ? '비교 안 함' : `${value} 미만`
}

export function formatPostMealHours(hours: number | null) {
  return hours ? `식후 ${hours}시간` : '모름'
}

export function formatMeasureSlots(slots: MeasureSlotKey[]) {
  return MEASURE_SLOT_ORDER.filter((key) => slots.includes(key))
    .map((key) => MEASURE_SLOT_LABEL[key])
    .join('·')
}

type CriteriaDraft = Pick<Criteria, 'postMealHours' | 'measureSlots' | 'targets'>

// 기준 바꾸기 전후 비교. 바뀐 항목만
export function diffCriteria(before: CriteriaDraft, after: CriteriaDraft) {
  const rows = [
    [
      '측정 시점',
      formatPostMealHours(before.postMealHours),
      formatPostMealHours(after.postMealHours),
    ],
    // 목록은 길어서 횟수로. 같은 횟수로 바뀌면 목록을 비교
    [
      '재는 때',
      `하루 ${before.measureSlots.length}번`,
      formatMeasureSlots(before.measureSlots) === formatMeasureSlots(after.measureSlots)
        ? `하루 ${before.measureSlots.length}번`
        : `하루 ${after.measureSlots.length}번${
            before.measureSlots.length === after.measureSlots.length ? '(바뀜)' : ''
          }`,
    ],
    ['공복 목표', formatTarget(before.targets.fasting), formatTarget(after.targets.fasting)],
    ['식후 목표', formatTarget(before.targets.postMeal), formatTarget(after.targets.postMeal)],
  ]
  return rows
    .filter(([, from, to]) => from !== to)
    .map(([label, from, to]) => ({ label, from, to }))
}
