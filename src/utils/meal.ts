import { MEAL_LABEL } from '@/constants/glucose'
import type { Food, Meal, MyFood, Nutrition, Portion } from '@/types/glucose'

const PORTION_AMOUNT: Record<Portion, string> = {
  half: '반',
  one: '1',
  'one-half': '1.5',
}

// 예: 반 공기 / 1공기 / 1.5공기
export function formatPortion(portion: Portion, unit: string) {
  return portion === 'half' ? `반 ${unit}` : `${PORTION_AMOUNT[portion]}${unit}`
}

const PORTION_FACTOR: Record<Portion, number> = {
  half: 0.5,
  one: 1,
  'one-half': 1.5,
}

// 1인분 값에 고른 양을 곱함. 양이 없으면(반찬) 1인분
export function scaleNutrition(nutrition: Nutrition, portion?: Portion) {
  const factor = portion ? PORTION_FACTOR[portion] : 1
  return {
    kcal: Math.round(nutrition.kcal * factor),
    carbs: Math.round(nutrition.carbs * factor),
    sugar: Math.round(nutrition.sugar * factor),
    protein: Math.round(nutrition.protein * factor),
    fat: Math.round(nutrition.fat * factor),
  }
}

// 영양 참고값을 볼 음식 하나
export type NutritionItem = {
  food: Food | MyFood
  // 주식이면 고른 양, 반찬이면 없음(1인분)
  portion?: Portion
}

// 예: 1공기 / 1접시
export function formatNutritionBasis({ food, portion }: NutritionItem) {
  return formatPortion(portion ?? 'one', food.unit)
}

export function findFood(name: string, foods: Food[]) {
  return foods.find((food) => food.name === name)
}

// 고른 음식 중 처음 나오는 주식
export function findStaple(names: string[], foods: Food[]) {
  return names.map((name) => findFood(name, foods)).find((food) => food?.staple)
}

// 예: 현미밥 1공기, 계란말이, 된장국(주식을 맨 앞에, 주식에만 양 표시)
export function formatMealContent(meal: Meal, foods: Food[]) {
  if (!meal.foods?.length) return ''
  const staple = findStaple(meal.foods, foods)
  if (!staple) return meal.foods.join(', ')
  const others = meal.foods.filter((name) => name !== staple.name)
  const main = meal.portion
    ? `${staple.name} ${formatPortion(meal.portion, staple.unit)}`
    : staple.name
  return [main, ...others].join(', ')
}

// 목록 한 줄. 예: 점심 · 김치볶음밥 1공기, 내용 없으면 점심 식사
export function formatMealLabel(meal: Meal, foods: Food[]) {
  const content = formatMealContent(meal, foods)
  return content ? `${MEAL_LABEL[meal.type]} · ${content}` : `${MEAL_LABEL[meal.type]} 식사`
}

// 이름에 이 글자가 있으면 주식으로 봄(내 음식 추가용)
const STAPLE_KEYWORDS = /밥|면|국수|빵|떡|죽/

export function looksLikeStaple(name: string) {
  return STAPLE_KEYWORDS.test(name)
}

// 받침 있으면 을, 없으면 를
export function withObjectParticle(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  if (code < 0 || code > 11171) return `${word}를`
  return `${word}${code % 28 ? '을' : '를'}`
}

// 저장 토스트. 예: 점심에 김치볶음밥 1공기를 적었어요
export function formatMealSavedMessage(meal: Meal, foods: Food[]) {
  return `${MEAL_LABEL[meal.type]}에 ${withObjectParticle(formatMealContent(meal, foods))} 적었어요`
}

// 최근 먹은 음식(최신순, 중복 제외)
export function getRecentFoods(meals: Meal[], limit: number) {
  const names: string[] = []
  for (const meal of [...meals].reverse()) {
    for (const name of meal.foods ?? []) {
      if (!names.includes(name)) names.push(name)
    }
  }
  return names.slice(0, limit)
}
