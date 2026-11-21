import { apiClient, type BaseResponse } from '@/api/axios'
import { getMeal } from '@/api/meals'
import type { Food, Meal, MyFood, NutritionEdit, NutritionEdits, Portion } from '@/types/glucose'
import {
  findFood,
  findStaple,
  getPortionFactor,
  gramsToServings,
  looksLikeStaple,
  toNearestPortion,
} from '@/utils/meal'

// 백엔드 MealNutrition. 먹은 양 전체 기준, 모르는 값은 null
type MealNutrition = {
  kcal: number | null
  carbG: number | null
  proteinG: number | null
  fatG: number | null
  sugarG: number | null
}

// 백엔드 MealItemSummaryResponse. 식사 상세 · 목록 · 오늘 · 기록 조회에 같이 옴
export type MealItemSummary = {
  itemId: number
  // 직접 적은 음식이면 null
  foodCode: string | null
  name: string
  servings: number
  weightG: number | null
  unit: 'g' | 'ml'
  nutritionSource: 'DB' | 'USER'
  nutrition: MealNutrition
  // 직접 적은 값만, 없으면 null
  nutritionOverride: MealNutrition | null
}

// 백엔드 MealItemResponse. mealUpdatedAt은 다음 영양값 입력의 expectedUpdatedAt
type MealItemResponse = MealItemSummary & { mealUpdatedAt: string }

type MealItemCreate =
  | { foodCode: string; servings: number; weightG?: number }
  | { name: string; servings: number; weightG?: number; nutrition?: MealNutrition }

// 식사에 음식 추가. foodCode · name 중 하나만, 직접 적은 음식만 nutrition
async function addMealItem(mealId: string, body: MealItemCreate) {
  const { data } = await apiClient.post<BaseResponse<MealItemResponse>>(
    `/meals/${mealId}/items`,
    body,
  )
  if (!data.data) throw new Error('식사 항목 추가 응답이 비어 있음')
  return data.data
}

// 먹은 양 바꾸기. 보낸 칸만 바뀌고, weightG를 null로 보내면 무게를 지우고 인분으로 계산
async function updateMealItem(
  mealId: string,
  itemId: number,
  changes: { servings?: number; weightG?: number | null },
) {
  const { data } = await apiClient.patch<BaseResponse<MealItemResponse>>(
    `/meals/${mealId}/items/${itemId}`,
    changes,
  )
  if (!data.data) throw new Error('식사 항목 수정 응답이 비어 있음')
  return data.data
}

// 내가 잰 영양값 넣기. 그사이 식사가 바뀌었으면 409 MEAL_40901
async function setMealItemNutrition(
  mealId: string,
  itemId: number,
  edit: NutritionEdit,
  expectedUpdatedAt: string,
) {
  const { data } = await apiClient.post<BaseResponse<MealItemResponse>>(
    `/meals/${mealId}/items/${itemId}/nutrition`,
    { nutritionOverride: toNutrition(edit), weightG: edit.grams ?? null, expectedUpdatedAt },
  )
  if (!data.data) throw new Error('영양값 입력 응답이 비어 있음')
  return data.data
}

// 식약처 값으로 되돌리기. 고른 음식만 됨
async function revertMealItemNutrition(mealId: string, itemId: number) {
  const { data } = await apiClient.delete<BaseResponse<MealItemResponse>>(
    `/meals/${mealId}/items/${itemId}/nutrition`,
  )
  if (!data.data) throw new Error('영양값 되돌리기 응답이 비어 있음')
  return data.data
}

// 음식 빼기
async function deleteMealItem(mealId: string, itemId: number) {
  await apiClient.delete(`/meals/${mealId}/items/${itemId}`)
}

// 서버는 소수 첫째 자리까지
const round1 = (value: number) => Math.round(value * 10) / 10

function toNutrition(values: Omit<NutritionEdit, 'grams' | 'editedAt'>): MealNutrition {
  return {
    kcal: round1(values.kcal),
    carbG: round1(values.carbs),
    proteinG: round1(values.protein),
    fatG: round1(values.fat),
    sugarG: round1(values.sugar),
  }
}

// 서버 인분 → 화면 양(반 · 1 · 1.5)
const toPortion = (servings: number): Portion => toNearestPortion(servings)

const isStaple = (name: string, known: Food[]) =>
  findFood(name, known)?.staple ?? looksLikeStaple(name)

// 서버 항목 → 화면 끼니 내용
export function toMealContent(
  items: MealItemSummary[],
  known: Food[],
  editedAt: string,
): Pick<Meal, 'foods' | 'portion' | 'stapleGrams' | 'portions' | 'nutritionEdits'> {
  const staple = items.find((item) => isStaple(item.name, known))
  // 그램은 식사 시트가 양을 받는 주식(처음 나오는 주식) 하나에만
  const gramStaple = findStaple(
    items.map((item) => item.name),
    known,
  )
  // 서버에 적은 무게 그대로. 이 기기가 모르는 음식이면 처음 나오는 주식 무게로
  const gramSource = items.find((item) => item.name === gramStaple?.name) ?? staple
  const portions = items.filter((item) => item !== staple && toPortion(item.servings) !== 'one')
  const edited = items.filter((item) => isEdited(item, known))
  return {
    foods: [...new Set(items.map((item) => item.name))],
    portion: staple ? toPortion(staple.servings) : undefined,
    stapleGrams: gramSource?.weightG ? Math.round(gramSource.weightG) : undefined,
    portions: portions.length
      ? Object.fromEntries(portions.map((item) => [item.name, toPortion(item.servings)]))
      : undefined,
    nutritionEdits: edited.length
      ? Object.fromEntries(
          edited.map((item) => [
            item.name,
            {
              kcal: item.nutrition.kcal ?? 0,
              carbs: item.nutrition.carbG ?? 0,
              sugar: item.nutrition.sugarG ?? 0,
              protein: item.nutrition.proteinG ?? 0,
              fat: item.nutrition.fatG ?? 0,
              grams: item.weightG ?? undefined,
              editedAt,
            },
          ]),
        )
      : undefined,
  }
}

const MIN_SERVINGS = 0.01

// 주식은 끼니 양(그램이면 1인분 무게로 나눔), 한상 사진은 음식별 양, 나머지는 1인분
function getServings(meal: Meal, name: string, known: Food[]) {
  const servingGrams = findFood(name, known)?.nutrition?.grams
  const gramStaple = findStaple(meal.foods ?? [], known)
  if (meal.stapleGrams && servingGrams && gramStaple?.name === name) {
    // 서버는 0인분을 안 받아서 아주 적은 무게도 0.01인분부터
    return Math.max(MIN_SERVINGS, gramsToServings(meal.stapleGrams, servingGrams))
  }
  const portion = (isStaple(name, known) && meal.portion) || meal.portions?.[name]
  return getPortionFactor(portion || undefined)
}

const near = (a: number | null, b: number | null) =>
  a !== null && b !== null && Math.abs(a - b) < 0.05

// 영양값 다섯 칸이 같은지(소수 첫째 자리)
function sameNutrition(saved: MealNutrition, sent: MealNutrition) {
  return (
    near(saved.kcal, sent.kcal) &&
    near(saved.carbG, sent.carbG) &&
    near(saved.proteinG, sent.proteinG) &&
    near(saved.fatG, sent.fatG) &&
    near(saved.sugarG, sent.sugarG)
  )
}

// 서버에 이미 같은 영양값이 들어가 있는지
function sameEdit(edit: NutritionEdit, item: MealItemSummary) {
  return (
    !!item.nutritionOverride &&
    sameNutrition(item.nutritionOverride, toNutrition(edit)) &&
    (item.weightG ?? undefined) === (edit.grams ?? undefined)
  )
}

// 직접 적은 음식은 추가할 때 내 음식 값도 같이 보내서, 그 값과 다를 때만 내가 잰 값
function isEdited(item: MealItemSummary, known: Food[]) {
  if (!item.nutritionOverride) return false
  if (item.foodCode) return true
  const mine = myFoodNutrition(findFood(item.name, known), item.servings)
  return !mine || !sameNutrition(item.nutritionOverride, mine)
}

// 내 음식의 1인분 영양값 × 먹은 양. 모르면 안 보냄
function myFoodNutrition(food: MyFood | Food | undefined, servings: number) {
  if (!food?.nutrition) return undefined
  const { kcal, carbs, sugar, protein, fat } = food.nutrition
  return toNutrition({
    kcal: kcal * servings,
    carbs: carbs * servings,
    sugar: sugar * servings,
    protein: protein * servings,
    fat: fat * servings,
  })
}

// 화면 끼니 내용대로 서버 항목을 맞춤. 같은 이름(고른 음식이면 같은 코드)은 그대로 두고 바뀐 것만 보냄
export async function applyMealItems(meal: Meal, known: Food[]) {
  const server = await getMeal(meal.id)
  let updatedAt = server.updatedAt
  const remaining = [...server.items]
  const edits: NutritionEdits = meal.nutritionEdits ?? {}
  // 그램은 이 기기가 아는 주식에만 보냄. 모르면 서버 무게를 건드리지 않음
  const gramStapleName = findStaple(meal.foods ?? [], known)?.name

  for (const name of meal.foods ?? []) {
    const food = findFood(name, known)
    const code = food?.code
    const servings = getServings(meal, name, known)
    const edit = edits[name]
    // 영양값을 직접 고친 음식은 영양값 저장이 무게를 맡음
    const sendsGrams = name === gramStapleName && !edit
    const index = remaining.findIndex(
      (item) => item.name === name && (code === undefined || item.foodCode === code),
    )
    let item: MealItemSummary
    if (index < 0) {
      const added = await addMealItem(
        meal.id,
        code
          ? { foodCode: code, servings, weightG: sendsGrams ? meal.stapleGrams : undefined }
          : {
              name,
              servings,
              weightG: edit?.grams ?? (sendsGrams ? meal.stapleGrams : undefined),
              nutrition: edit ? toNutrition(edit) : myFoodNutrition(food, servings),
            },
      )
      updatedAt = added.mealUpdatedAt
      item = added
      // 직접 적은 음식은 추가할 때 영양값까지 넣음
      if (!code) continue
    } else {
      item = remaining.splice(index, 1)[0]
      const changes: { servings?: number; weightG?: number | null } = {}
      if (item.servings !== servings) changes.servings = servings
      if (sendsGrams && (item.weightG ?? undefined) !== meal.stapleGrams) {
        changes.weightG = meal.stapleGrams ?? null
      }
      if (Object.keys(changes).length > 0) {
        const updated = await updateMealItem(meal.id, item.itemId, changes)
        updatedAt = updated.mealUpdatedAt
        item = updated
      }
    }
    if (edit && !sameEdit(edit, item)) {
      updatedAt = (await setMealItemNutrition(meal.id, item.itemId, edit, updatedAt)).mealUpdatedAt
    } else if (!edit && item.foodCode && item.nutritionSource === 'USER') {
      updatedAt = (await revertMealItemNutrition(meal.id, item.itemId)).mealUpdatedAt
    }
  }

  // 수정 시각이 필요 없는 빼기는 마지막에
  for (const item of remaining) await deleteMealItem(meal.id, item.itemId)
}
