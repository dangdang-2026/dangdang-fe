import { useMemo } from 'react'
import { MOCK_FOODS } from '@/mocks/foods'
import { useFoodStore } from '@/stores/useFoodStore'

// 식품 목록 + 내 음식
export function useFoods() {
  const myFoods = useFoodStore((state) => state.myFoods)
  return useMemo(() => [...myFoods, ...MOCK_FOODS], [myFoods])
}
