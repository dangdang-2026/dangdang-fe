import { apiClient, type BaseResponse } from '@/api/axios'
import type { ServerMealSlot } from '@/api/meals'
import type { InsulinRecord, MealType } from '@/types/glucose'
import { toDateKey } from '@/utils/date'

// 백엔드 InsulinType. 식사 때(속효성) · 자기 전(지속형)
type ServerInsulinType = 'MEAL' | 'BEDTIME'

// 백엔드 InsulinLogResponse. units는 6.0처럼 소수 한 자리
export type InsulinLogResponse = {
  insulinLogId: number
  insulinType: ServerInsulinType
  mealSlot: ServerMealSlot | null
  units: number
  takenAt: string
  editedAt: string | null
}

type InsulinLogPageResponse = {
  items: InsulinLogResponse[]
  page: number
  size: number
  hasNext: boolean
}

const MEAL_FROM_SLOT: Partial<Record<ServerMealSlot, MealType>> = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
}

// 서버 기록 → 화면 기록. id는 서버 번호
export function fromServerInsulin(item: InsulinLogResponse): InsulinRecord {
  return {
    id: String(item.insulinLogId),
    kind: item.insulinType === 'MEAL' ? 'meal' : 'bedtime',
    mealType: (item.mealSlot && MEAL_FROM_SLOT[item.mealSlot]) || undefined,
    units: Number(item.units),
    takenAt: item.takenAt,
    editedAt: item.editedAt ?? undefined,
    server: true,
  }
}

const MEAL_SLOT: Record<MealType, ServerMealSlot> = {
  breakfast: 'BREAKFAST',
  lunch: 'LUNCH',
  dinner: 'DINNER',
}

// 화면에서 적는 값. 식사 때면 끼니가 꼭 있음
export type InsulinInput = {
  kind: 'meal' | 'bedtime'
  mealType?: MealType
  units: number
  takenAt: string
}

// 인슐린 등록. 적은 그대로 저장만 하고 권장량 계산 · 투여 알림은 없음
export async function createInsulinLog(input: InsulinInput) {
  const { data } = await apiClient.post<BaseResponse<InsulinLogResponse>>('/insulin-logs', {
    insulinType: input.kind === 'meal' ? 'MEAL' : 'BEDTIME',
    mealSlot: input.kind === 'meal' && input.mealType ? MEAL_SLOT[input.mealType] : undefined,
    units: input.units,
    takenAt: input.takenAt,
  })
  if (!data.data) throw new Error('인슐린 등록 응답이 비어 있음')
  return fromServerInsulin(data.data)
}

// from~to(둘 다 포함, 한국 날짜) 인슐린 기록. 한 번에 100개씩 끝까지
export async function getInsulinLogs(from: Date, to: Date) {
  const logs: InsulinRecord[] = []
  for (let page = 0; ; page++) {
    const { data } = await apiClient.get<BaseResponse<InsulinLogPageResponse>>('/insulin-logs', {
      params: { from: toDateKey(from), to: toDateKey(to), page, size: 100 },
    })
    if (!data.data) throw new Error('인슐린 기록 조회 응답이 비어 있음')
    logs.push(...data.data.items.map(fromServerInsulin))
    if (!data.data.hasNext) return logs
  }
}

// 인슐린 고치기. 칸을 다 보내고 바뀐 칸만 서버가 editedAt을 찍음. 자기 전으로 바꾸면 끼니는 서버가 지움
export async function updateInsulinLog(id: string, input: InsulinInput) {
  const { data } = await apiClient.patch<BaseResponse<InsulinLogResponse>>(`/insulin-logs/${id}`, {
    insulinType: input.kind === 'meal' ? 'MEAL' : 'BEDTIME',
    mealSlot: input.kind === 'meal' && input.mealType ? MEAL_SLOT[input.mealType] : undefined,
    units: input.units,
    takenAt: input.takenAt,
  })
  if (!data.data) throw new Error('인슐린 수정 응답이 비어 있음')
  return fromServerInsulin(data.data)
}

// 인슐린 지우기. 서버는 지운 시각만 남기고 목록 · 오늘 화면에서 뺌
export async function deleteInsulinLog(id: string) {
  await apiClient.delete(`/insulin-logs/${id}`)
}
