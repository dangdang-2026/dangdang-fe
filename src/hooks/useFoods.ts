import { useEffect, useMemo, useState } from 'react'
import { searchFoods } from '@/api/foods'
import { useFoodStore } from '@/stores/useFoodStore'
import type { Food } from '@/types/glucose'

// 이름으로 다시 찾을 음식. 내 음식 + 검색에서 고른 서버 음식
export function useFoods() {
  const myFoods = useFoodStore((state) => state.myFoods)
  const pickedFoods = useFoodStore((state) => state.pickedFoods)
  return useMemo(() => [...myFoods, ...pickedFoods], [myFoods, pickedFoods])
}

// 입력을 멈추고 기다렸다 검색. 글자마다 서버를 부르지 않게
const SEARCH_DELAY_MS = 300

export type FoodSearchStatus = 'idle' | 'loading' | 'done' | 'error'

// 검색어로 서버 음식 검색. 내 음식 중 이름이 맞는 것을 앞에 붙임
export function useFoodSearch(keyword: string, limit: number) {
  const myFoods = useFoodStore((state) => state.myFoods)
  const [result, setResult] = useState<{ keyword: string; foods: Food[] | null } | null>(null)

  useEffect(() => {
    if (!keyword) return
    // 늦게 온 이전 검색어 결과는 버림
    let stale = false
    const timer = window.setTimeout(() => {
      searchFoods(keyword, limit)
        .then((foods) => {
          if (!stale) setResult({ keyword, foods })
        })
        .catch(() => {
          if (!stale) setResult({ keyword, foods: null })
        })
    }, SEARCH_DELAY_MS)
    return () => {
      stale = true
      window.clearTimeout(timer)
    }
  }, [keyword, limit])

  const mine = keyword ? myFoods.filter((food) => food.name.includes(keyword)) : []
  const server = result?.keyword === keyword ? result.foods : undefined
  const status: FoodSearchStatus = !keyword
    ? 'idle'
    : server === undefined
      ? 'loading'
      : server === null
        ? 'error'
        : 'done'
  const names = new Set(mine.map((food) => food.name))
  const foods = [...mine, ...(server ?? []).filter((food) => !names.has(food.name))].slice(0, limit)
  return { foods, status }
}
