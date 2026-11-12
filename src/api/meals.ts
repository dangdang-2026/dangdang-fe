import { apiClient, type BaseResponse } from '@/api/axios'
import type { MealType } from '@/types/glucose'

// 백엔드 MealSlot. 간식(SNACK)은 프론트 끼니에 없음
type ServerMealSlot = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'

// 백엔드 MealResponse
type MealResponse = {
  mealId: number
  mealSlot: ServerMealSlot
  startedAt: string
  startedOffline: boolean
  note: string | null
  createdAt: string
  updatedAt: string
}

const MEAL_SLOT: Record<MealType, ServerMealSlot> = {
  breakfast: 'BREAKFAST',
  lunch: 'LUNCH',
  dinner: 'DINNER',
}

// 식사 시작 등록. 서버가 병원 기준 시간 뒤 측정 알림을 예약함
export async function createMeal(type: MealType, startedAt: Date) {
  const { data } = await apiClient.post<BaseResponse<MealResponse>>('/meals', {
    mealSlot: MEAL_SLOT[type],
    startedAt: startedAt.toISOString(),
  })
  if (!data.data) throw new Error('식사 등록 응답이 비어 있음')
  return { id: String(data.data.mealId), startedAt: data.data.startedAt }
}
