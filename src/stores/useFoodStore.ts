import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MyFood } from '@/types/glucose'

type FoodState = {
  myFoods: MyFood[]
  addMyFood: (food: MyFood) => void
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
    }),
    { name: 'dangdang-foods' },
  ),
)
