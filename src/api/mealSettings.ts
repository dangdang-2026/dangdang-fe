import { apiClient, type BaseResponse } from '@/api/axios'

// 식사 기록에서 양을 적는 방식. 바꾼 적 없으면 서버가 SERVING
export type PortionUnit = 'SERVING' | 'GRAM'

// 백엔드 MealSettingsResponse
type MealSettingsResponse = { portionUnit: PortionUnit }

// 내 식사 기록 설정
export async function getMealSettings() {
  const { data } = await apiClient.get<BaseResponse<MealSettingsResponse>>('/me/meal-settings')
  return data.data?.portionUnit ?? 'SERVING'
}

// 양 적는 방식 바꾸기. 서버가 저장한 값을 돌려줌
export async function updateMealSettings(portionUnit: PortionUnit) {
  const { data } = await apiClient.patch<BaseResponse<MealSettingsResponse>>('/me/meal-settings', {
    portionUnit,
  })
  return data.data?.portionUnit ?? portionUnit
}
