import { apiClient, type BaseResponse } from '@/api/axios'
import type { GlucoseRecord, MealType, MeasureTarget } from '@/types/glucose'

// 백엔드 ReadingType · MeasureSlot
type ReadingType = 'FASTING' | 'POST_MEAL' | 'OTHER'
type ServerSlot = 'FASTING' | 'BREAKFAST_AFTER' | 'LUNCH_AFTER' | 'DINNER_AFTER' | 'BEDTIME'

// 백엔드 ReadingResponse
type ReadingResponse = {
  readingId: number
  value: number
  measuredAt: string
  readingType: ReadingType
  slot: ServerSlot | null
  criteriaVersionId: number
  mealId: number | null
  enteredLate: boolean
  createdAt: string
  updatedAt: string
}

const MEAL_SLOT: Record<MealType, ServerSlot> = {
  breakfast: 'BREAKFAST_AFTER',
  lunch: 'LUNCH_AFTER',
  dinner: 'DINNER_AFTER',
}

const MEAL_FROM_SLOT: Partial<Record<ServerSlot, MealType>> = {
  BREAKFAST_AFTER: 'breakfast',
  LUNCH_AFTER: 'lunch',
  DINNER_AFTER: 'dinner',
}

// 공복 → FASTING, 식후 → POST_MEAL + 끼니, 자기 전 → OTHER + BEDTIME
function toServerType(target: Pick<MeasureTarget, 'slot' | 'mealType'>) {
  if (target.slot === 'fasting') return { readingType: 'FASTING', slot: 'FASTING' } as const
  if (target.slot === 'bedtime') return { readingType: 'OTHER', slot: 'BEDTIME' } as const
  return {
    readingType: 'POST_MEAL',
    slot: target.mealType ? MEAL_SLOT[target.mealType] : null,
  } as const
}

// 등록 직후 updatedAt이 createdAt과 조금 달라도 고친 걸로 보지 않음
const EDITED_GAP_MS = 1000

// 서버 기록 → 화면 기록. 끼니 연결(mealId)은 끼니 API 전까지 기기에서만 붙임
export function toGlucoseRecord(item: ReadingResponse): GlucoseRecord {
  const edited =
    new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime() > EDITED_GAP_MS
  return {
    id: String(item.readingId),
    slot:
      item.readingType === 'FASTING'
        ? 'fasting'
        : item.readingType === 'POST_MEAL'
          ? 'post-meal'
          : 'bedtime',
    value: item.value,
    measuredAt: item.measuredAt,
    // 리포트 '나중 입력'은 기존처럼 측정·입력 시각 차이로 판단
    enteredAt: item.createdAt,
    mealType: item.slot ? MEAL_FROM_SLOT[item.slot] : undefined,
    editedAt: edited ? item.updatedAt : undefined,
    criteriaId: item.criteriaVersionId,
  }
}

// 혈당 등록. 잰 날짜의 병원 기준은 서버가 붙임
export async function createReading(target: MeasureTarget, value: number, measuredAt: Date) {
  const { data } = await apiClient.post<BaseResponse<ReadingResponse>>('/readings', {
    value,
    measuredAt: measuredAt.toISOString(),
    ...toServerType(target),
  })
  if (!data.data) throw new Error('혈당 등록 응답이 비어 있음')
  return toGlucoseRecord(data.data)
}
