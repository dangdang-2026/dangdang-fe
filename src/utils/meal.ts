import { MEAL_LABEL } from '@/constants/glucose'
import type { Food, Meal, Portion } from '@/types/glucose'

const PORTION_AMOUNT: Record<Portion, string> = {
  half: '반',
  one: '1',
  'one-half': '1.5',
}

// 예: 반 공기 / 1공기 / 1.5공기
export function formatPortion(portion: Portion, unit: string) {
  return portion === 'half' ? `반 ${unit}` : `${PORTION_AMOUNT[portion]}${unit}`
}

export function findFood(name: string, foods: Food[]) {
  return foods.find((food) => food.name === name)
}

// 예: 김치볶음밥 1공기 / 현미밥, 계란말이(여러 개면 양 생략)
export function formatMealContent(meal: Meal, foods: Food[]) {
  if (!meal.foods?.length) return ''
  if (meal.foods.length > 1 || !meal.portion) return meal.foods.join(', ')
  const unit = findFood(meal.foods[0], foods)?.unit ?? '인분'
  return `${meal.foods[0]} ${formatPortion(meal.portion, unit)}`
}

// 목록 한 줄. 예: 점심 · 김치볶음밥 1공기, 내용 없으면 점심 식사
export function formatMealLabel(meal: Meal, foods: Food[]) {
  const content = formatMealContent(meal, foods)
  return content ? `${MEAL_LABEL[meal.type]} · ${content}` : `${MEAL_LABEL[meal.type]} 식사`
}

// 받침 있으면 을, 없으면 를
export function withObjectParticle(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  if (code < 0 || code > 11171) return `${word}를`
  return `${word}${code % 28 ? '을' : '를'}`
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
