import { apiClient, type BaseResponse } from '@/api/axios'
import type { Food, MyFood, Portion } from '@/types/glucose'
import { findFood } from '@/utils/meal'

type UsualQuantity = 'HALF' | 'ONE' | 'ONE_HALF'

// 백엔드 MealNutrition. 1인분 기준, 모르는 값은 null
type MyFoodNutrition = {
  kcal: number | null
  carbG: number | null
  proteinG: number | null
  fatG: number | null
  sugarG: number | null
}

// 백엔드 MyFoodResponse
export type MyFoodResponse = {
  id: number
  name: string
  similarFoodCode: string | null
  usualQuantity: UsualQuantity | null
  usualGrams: number | null
  nutritionOverride: MyFoodNutrition | null
  updatedAt: string
  // 비슷한 음식을 따른 주식 여부, 없으면 false. 배포 전 서버엔 없음
  isStaple?: boolean
  // 양을 부르는 말. 비슷한 음식을 따르고 없으면 인분
  unitLabel?: string
}

const QUANTITY: Record<Portion, UsualQuantity> = {
  half: 'HALF',
  one: 'ONE',
  'one-half': 'ONE_HALF',
}
const PORTION: Record<UsualQuantity, Portion> = { HALF: 'half', ONE: 'one', ONE_HALF: 'one-half' }

// 비슷한 음식이 없을 때 양 단위
export const MY_FOOD_UNIT = '인분'
// 1인분 무게를 모르면 100g 기준으로 봄
const BASE_GRAMS = 100
// 서버 보통 먹는 양 범위(g)
const MIN_GRAMS = 1
const MAX_GRAMS = 2000

const round1 = (value: number) => Math.round(value * 10) / 10

// 화면 내 음식 → 서버 칸. 비슷한 음식은 식품코드로, 모르는 칸은 null
function toBody(food: MyFood, known: Food[]) {
  const nutrition = food.nutrition
  return {
    name: food.name,
    similarFoodCode: (food.similarTo && findFood(food.similarTo, known)?.code) || null,
    usualQuantity: food.portion ? QUANTITY[food.portion] : null,
    usualGrams: nutrition
      ? Math.min(MAX_GRAMS, Math.max(MIN_GRAMS, Math.round(nutrition.grams)))
      : null,
    nutritionOverride: nutrition
      ? {
          kcal: round1(nutrition.kcal),
          carbG: round1(nutrition.carbs),
          proteinG: round1(nutrition.protein),
          fatG: round1(nutrition.fat),
          sugarG: round1(nutrition.sugar),
        }
      : null,
  }
}

// 서버 내 음식 → 화면 내 음식. 비슷한 음식 이름은 known에서 코드로 찾음
export function toMyFood(item: MyFoodResponse, known: Food[]): MyFood {
  const similar = item.similarFoodCode
    ? known.find((food) => food.code === item.similarFoodCode)
    : undefined
  const n = item.nutritionOverride
  return {
    serverId: item.id,
    name: item.name,
    unit: item.unitLabel ?? similar?.unit ?? MY_FOOD_UNIT,
    // 칸이 없는 예전 서버는 내 음식 추가 화면처럼 비슷한 음식을 따름
    staple: item.isStaple ?? !!similar?.staple,
    similarTo: similar?.name,
    portion: item.usualQuantity ? PORTION[item.usualQuantity] : undefined,
    nutrition: n
      ? {
          grams: item.usualGrams ?? BASE_GRAMS,
          kcal: n.kcal ?? 0,
          carbs: n.carbG ?? 0,
          sugar: n.sugarG ?? 0,
          protein: n.proteinG ?? 0,
          fat: n.fatG ?? 0,
        }
      : undefined,
  }
}

// 내 음식 목록. 최근에 고친 순
export async function getMyFoods() {
  const { data } = await apiClient.get<BaseResponse<MyFoodResponse[]>>('/me/foods')
  return data.data ?? []
}

// 내 음식 추가. 같은 이름이 있으면 409 MYFOOD_40901
export async function createMyFood(food: MyFood, known: Food[]) {
  const body = toBody(food, known)
  const { data } = await apiClient.post<BaseResponse<MyFoodResponse>>('/me/foods', {
    name: body.name,
    similarFoodCode: body.similarFoodCode ?? undefined,
    usualQuantity: body.usualQuantity ?? undefined,
    usualGrams: body.usualGrams ?? undefined,
    nutritionOverride: body.nutritionOverride ?? undefined,
  })
  if (!data.data) throw new Error('내 음식 추가 응답이 비어 있음')
  return data.data
}

// 내 음식 고치기. 칸 전체를 보내고 없는 칸은 clear로 비움
export async function updateMyFood(id: number, food: MyFood, known: Food[]) {
  const body = toBody(food, known)
  const fields = ['similarFoodCode', 'usualQuantity', 'usualGrams', 'nutritionOverride'] as const
  const { data } = await apiClient.patch<BaseResponse<MyFoodResponse>>(`/me/foods/${id}`, {
    name: body.name,
    ...Object.fromEntries(
      fields.filter((key) => body[key] !== null).map((key) => [key, body[key]]),
    ),
    clear: fields.filter((key) => body[key] === null),
  })
  if (!data.data) throw new Error('내 음식 고치기 응답이 비어 있음')
  return data.data
}

// 내 음식 지우기. 지난 끼니 기록은 그대로
export async function deleteMyFood(id: number) {
  await apiClient.delete(`/me/foods/${id}`)
}
