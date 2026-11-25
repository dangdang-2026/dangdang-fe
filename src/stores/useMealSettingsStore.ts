import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getMealSettings, updateMealSettings, type PortionUnit } from '@/api/mealSettings'

type MealSettingsState = {
  portionUnit: PortionUnit
  setPortionUnit: (portionUnit: PortionUnit) => void
}

// 서버 식사 기록 설정을 기기에도 둠. 식사 시트가 처음 보여 줄 양 칸
export const useMealSettingsStore = create<MealSettingsState>()(
  persist(
    (set) => ({
      portionUnit: 'SERVING',
      setPortionUnit: (portionUnit) => set({ portionUnit }),
    }),
    { name: 'dangdang-meal-settings' },
  ),
)

// 저장할 때마다 올림. 받아 오는 사이 저장했으면 늦게 온 옛 값은 버림
let saveCount = 0

// 서버 값으로 맞춤. 다른 계정 설정이 남지 않게 로그인 · 앱 열 때
export async function syncMealSettings() {
  const startedAt = saveCount
  const portionUnit = await getMealSettings()
  if (startedAt === saveCount) useMealSettingsStore.getState().setPortionUnit(portionUnit)
}

// 서버에 저장한 뒤 기기에 반영
export async function saveMealSettings(portionUnit: PortionUnit) {
  saveCount += 1
  useMealSettingsStore.getState().setPortionUnit(await updateMealSettings(portionUnit))
}
