import { apiClient, type BaseResponse } from '@/api/axios'

// 백엔드 MealPlanResponse. careSiteId는 내 병원 번호, 지운 병원이면 null
export type MealPlanResponse = {
  id: number
  careSiteId: number | null
  receivedOn: string | null
  mealGuide: string | null
  snackGuide: string | null
  updatedAt: string
}

export type MealPlanInput = {
  careSiteId: number | null
  receivedOn: string
  mealGuide: string
  snackGuide: string
}

// 내 식사 안내. 없으면 null
export async function getMealPlan() {
  const { data } = await apiClient.get<BaseResponse<MealPlanResponse | null>>('/me/meal-plan')
  return data.data ?? null
}

// 통째로 저장. 끼니 · 간식 중 하나는 있어야 함. 빈 칸은 안 보냄
export async function saveMealPlan(input: MealPlanInput) {
  const { data } = await apiClient.put<BaseResponse<MealPlanResponse>>('/me/meal-plan', {
    careSiteId: input.careSiteId ?? undefined,
    receivedOn: input.receivedOn,
    mealGuide: input.mealGuide || undefined,
    snackGuide: input.snackGuide || undefined,
  })
  if (!data.data) throw new Error('식사 안내 저장 응답이 비어 있음')
  return data.data
}
