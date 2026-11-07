import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MyFood } from '@/types/glucose'

type FoodState = {
  myFoods: MyFood[]
  addMyFood: (food: MyFood) => void
  // 이름이 바뀌어도 원래 자리 유지
  updateMyFood: (name: string, food: MyFood) => void
  removeMyFood: (name: string) => void
}

// 내 음식. 나만 보이고 API 연동 전까지 기기에 저장
export const useFoodStore = create<FoodState>()(
  persist(
    (set) => ({
      myFoods: [],
      addMyFood: (food) =>
        set((state) => ({
          myFoods: [...state.myFoods.filter((item) => item.name !== food.name), food],
        })),
      updateMyFood: (name, food) =>
        set((state) => ({
          myFoods: state.myFoods
            .filter((item) => item.name === name || item.name !== food.name)
            .map((item) => (item.name === name ? food : item)),
        })),
      removeMyFood: (name) =>
        set((state) => ({ myFoods: state.myFoods.filter((item) => item.name !== name) })),
    }),
    { name: 'dangdang-foods' },
  ),
)
