import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GlucoseRecord, Meal, MealType, MeasureTarget } from '@/types/glucose'

type GlucoseState = {
  meals: Meal[]
  records: GlucoseRecord[]
  startMeal: (type: MealType, now?: Date) => void
  skipMeal: (mealId: string) => void
  addRecord: (target: MeasureTarget, value: number, now?: Date) => GlucoseRecord
  updateRecord: (id: string, changes: { value: number; measuredAt: string }, now?: Date) => void
  deleteRecord: (id: string, now?: Date) => void
  // 지운 기록. 화면·리포트에선 빼고 기록용으로만 보관
  deletedRecords: (GlucoseRecord & { deletedAt: string })[]
}

// API 연동 전까지 기기(localStorage)에 저장
export const useGlucoseStore = create<GlucoseState>()(
  persist(
    (set) => ({
      meals: [],
      records: [],
      startMeal: (type, now = new Date()) =>
        set((state) => ({
          meals: [
            ...state.meals,
            { id: crypto.randomUUID(), type, startedAt: now.toISOString(), skipped: false },
          ],
        })),
      skipMeal: (mealId) =>
        set((state) => ({
          meals: state.meals.map((meal) =>
            meal.id === mealId ? { ...meal, skipped: true } : meal,
          ),
        })),
      addRecord: (target, value, now = new Date()) => {
        const record: GlucoseRecord = {
          id: crypto.randomUUID(),
          slot: target.slot,
          value,
          measuredAt: now.toISOString(),
          mealId: target.mealId,
          mealType: target.mealType,
        }
        set((state) => ({ records: [...state.records, record] }))
        return record
      },
      updateRecord: (id, changes, now = new Date()) =>
        set((state) => ({
          records: state.records.map((record) =>
            record.id === id
              ? {
                  ...record,
                  ...changes,
                  editedAt: now.toISOString(),
                  original: record.original ?? {
                    value: record.value,
                    measuredAt: record.measuredAt,
                  },
                }
              : record,
          ),
        })),
      deletedRecords: [],
      deleteRecord: (id, now = new Date()) =>
        set((state) => {
          const target = state.records.find((record) => record.id === id)
          if (!target) return state
          return {
            records: state.records.filter((record) => record.id !== id),
            deletedRecords: [...state.deletedRecords, { ...target, deletedAt: now.toISOString() }],
          }
        }),
    }),
    { name: 'dangdang-glucose' },
  ),
)
