import { apiClient, type BaseResponse } from '@/api/axios'
import type { Food } from '@/types/glucose'
import { looksLikeStaple } from '@/utils/meal'

// 백엔드 FoodOrigin. 같은 이름이 출처별로 여러 줄일 때 구분용
type FoodOrigin = 'HOME' | 'RESTAURANT' | 'MEAL_SERVICE' | 'FRANCHISE'

// 백엔드 FoodResponse. 영양값은 1인분 기준, servingG가 null이면 100g(ml)당. 모르는 값은 null
type FoodResponse = {
  foodCode: string
  name: string
  displayName: string
  origin: FoodOrigin
  maker: string | null
  servingG: number | null
  servingUnit: 'g' | 'ml'
  kcal: number | null
  carbG: number | null
  proteinG: number | null
  fatG: number | null
  sugarG: number | null
  sourceVersion: string
}

// 백엔드 FoodPageResponse
type FoodPageResponse = {
  items: FoodResponse[]
  page: number
  size: number
  totalElements: number
  hasNext: boolean
}

// 서버엔 공기·그릇 같은 단위가 없어 1인분으로 표시
const SERVER_FOOD_UNIT = '인분'
// 1인분 양을 모르면 영양값이 100g(ml)당
const BASE_AMOUNT = 100

// 서버 음식 → 화면 음식. 열량·탄수화물을 모르면 영양 참고값 없음, 나머지 모르는 값은 0
function toFood(item: FoodResponse): Food {
  const { kcal, carbG } = item
  return {
    code: item.foodCode,
    name: item.displayName,
    unit: SERVER_FOOD_UNIT,
    // 서버에 주식 구분이 없어 이름(밥·면 등)으로 판단
    staple: looksLikeStaple(item.displayName),
    nutrition:
      kcal === null || carbG === null
        ? undefined
        : {
            grams: item.servingG ?? BASE_AMOUNT,
            kcal,
            carbs: carbG,
            sugar: item.sugarG ?? 0,
            protein: item.proteinG ?? 0,
            fat: item.fatG ?? 0,
          },
  }
}

// 음식 상세. sourceVersion은 식약처 데이터기준일(2026-09-29). 없는 코드면 FOOD_40401
export async function getFood(code: string) {
  const { data } = await apiClient.get<BaseResponse<FoodResponse>>(
    `/foods/${encodeURIComponent(code)}`,
  )
  if (!data.data) throw new Error('음식 상세 응답이 비어 있음')
  return { food: toFood(data.data), sourceVersion: data.data.sourceVersion }
}

// 음식 이름 검색. 서버가 가정식·외식부터 정렬해 주므로 같은 이름은 앞의 것만 남김
export async function searchFoods(q: string, size: number) {
  const { data } = await apiClient.get<BaseResponse<FoodPageResponse>>('/foods', {
    params: { q, size },
  })
  const foods = (data.data?.items ?? []).map(toFood)
  return foods.filter((food, index) => foods.findIndex((item) => item.name === food.name) === index)
}
