import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Food, MyFood } from '@/types/glucose'

type FoodState = {
  myFoods: MyFood[]
  addMyFood: (food: MyFood) => void
  // 이름이 바뀌어도 원래 자리 유지
  updateMyFood: (name: string, food: MyFood) => void
  removeMyFood: (name: string) => void
  // 검색에서 고른 서버 음식. 끼니엔 이름만 남아서 이름으로 영양값·주식 여부를 다시 찾음
  pickedFoods: Food[]
  rememberFood: (food: Food) => void
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
      pickedFoods: [],
      rememberFood: (food) =>
        set((state) => ({
          pickedFoods: [...state.pickedFoods.filter((item) => item.name !== food.name), food],
        })),
    }),
    { name: 'dangdang-foods' },
  ),
)
