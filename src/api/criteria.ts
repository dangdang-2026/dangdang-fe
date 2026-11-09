import { apiClient, type BaseResponse } from '@/api/axios'
import type { Criteria, MeasureSlotKey } from '@/types/criteria'
import { MEASURE_SLOT_ORDER } from '@/utils/criteria'

// 백엔드 MeasureSlot
type ServerMeasureSlot = 'FASTING' | 'BREAKFAST_AFTER' | 'LUNCH_AFTER' | 'DINNER_AFTER' | 'BEDTIME'

// 백엔드 CriteriaVersionResponse
type CriteriaVersionResponse = {
  criteriaVersionId: number
  postMealMinutes: number | null
  measureSlots: ServerMeasureSlot[] | null
  fastingTarget: number | null
  postMealTarget: number | null
  sourceNote: string | null
  // 한국 날짜 yyyy-MM-dd
  effectiveFrom: string
  createdAt: string
}

const SLOT_FROM_SERVER: Record<ServerMeasureSlot, MeasureSlotKey> = {
  FASTING: 'fasting',
  BREAKFAST_AFTER: 'breakfast',
  LUNCH_AFTER: 'lunch',
  DINNER_AFTER: 'dinner',
  BEDTIME: 'bedtime',
}

// 첫 버전은 아주 옛날부터 적용해 이전 기록도 비교되게 (useCriteriaStore와 같은 값)
export const FIRST_APPLIED_FROM = new Date(2000, 0, 1).toISOString()

// yyyy-MM-dd를 그 날 0시(기기 시간)로
function toAppliedFrom(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toISOString()
}

// 서버는 최신 먼저 → 프론트는 오래된 순. 같은 날 여러 번 바꿨으면 나중 것만 (서버 적용 규칙과 같음)
function toCriteriaVersions(items: CriteriaVersionResponse[]): Criteria[] {
  const latestPerDay = items.filter(
    (item, index) =>
      items.findIndex((other) => other.effectiveFrom === item.effectiveFrom) === index,
  )
  return latestPerDay.reverse().map((item, index) => {
    const slots = (item.measureSlots ?? []).map((slot) => SLOT_FROM_SERVER[slot])
    return {
      id: item.criteriaVersionId,
      // 화면의 v1·v2는 순번이라 서버 id 대신 차례로 매김
      version: index + 1,
      appliedFrom: index === 0 ? FIRST_APPLIED_FROM : toAppliedFrom(item.effectiveFrom),
      source: item.sourceNote ?? '',
      postMealHours: item.postMealMinutes === null ? null : item.postMealMinutes / 60,
      measureSlots: MEASURE_SLOT_ORDER.filter((key) => slots.includes(key)),
      targets: { fasting: item.fastingTarget, postMeal: item.postMealTarget },
    }
  })
}

// 내 기준 전부. 한 번도 안 적었으면 빈 배열
export async function getCriteriaHistory() {
  const { data } =
    await apiClient.get<BaseResponse<CriteriaVersionResponse[]>>('/criteria-versions')
  return toCriteriaVersions(data.data ?? [])
}
