import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createReading } from '@/api/readings'
import type {
  GlucoseRecord,
  InsulinRecord,
  Meal,
  MealType,
  MeasureTarget,
  NutritionEdits,
  Portion,
} from '@/types/glucose'

type InsulinInput = Pick<InsulinRecord, 'kind' | 'name' | 'units' | 'takenAt'>

type GlucoseState = {
  meals: Meal[]
  records: GlucoseRecord[]
  startMeal: (type: MealType, now?: Date) => void
  skipMeal: (mealId: string) => void
  // nutritionEdits를 안 넘기면 원래 고친 값 유지
  setMealContent: (
    mealId: string,
    foods: string[],
    portion?: Portion,
    nutritionEdits?: NutritionEdits,
  ) => void
  // 사진으로 적은 끼니의 AI 후보·음식별 양
  setMealPhotoInfo: (mealId: string, info: Pick<Meal, 'aiCandidates' | 'portions'>) => void
  // 서버에 저장된 기록을 기기에 추가
  addRecord: (record: GlucoseRecord) => void
  updateRecord: (id: string, changes: { value: number; measuredAt: string }, now?: Date) => void
  deleteRecord: (id: string, now?: Date) => void
  // 지운 기록. 화면·리포트에선 빼고 기록용으로만 보관
  deletedRecords: (GlucoseRecord & { deletedAt: string })[]
  insulins: InsulinRecord[]
  addInsulin: (input: InsulinInput) => void
  updateInsulin: (id: string, input: InsulinInput, now?: Date) => void
}

// 뺀 음식의 고친 값은 버림. 남는 게 없으면 없음
function keepEdits(edits: NutritionEdits | undefined, foods: string[]) {
  const kept = Object.entries(edits ?? {}).filter(([name]) => foods.includes(name))
  return kept.length > 0 ? Object.fromEntries(kept) : undefined
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
      setMealContent: (mealId, foods, portion, nutritionEdits) =>
        set((state) => ({
          meals: state.meals.map((meal) =>
            meal.id === mealId
              ? {
                  ...meal,
                  foods,
                  portion,
                  nutritionEdits: keepEdits(nutritionEdits ?? meal.nutritionEdits, foods),
                }
              : meal,
          ),
        })),
      setMealPhotoInfo: (mealId, info) =>
        set((state) => ({
          meals: state.meals.map((meal) => (meal.id === mealId ? { ...meal, ...info } : meal)),
        })),
      addRecord: (record) => set((state) => ({ records: [...state.records, record] })),
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
      insulins: [],
      addInsulin: (input) =>
        set((state) => ({ insulins: [...state.insulins, { id: crypto.randomUUID(), ...input }] })),
      updateInsulin: (id, input, now = new Date()) =>
        set((state) => ({
          insulins: state.insulins.map((item) =>
            item.id === id ? { ...item, ...input, editedAt: now.toISOString() } : item,
          ),
        })),
    }),
    { name: 'dangdang-glucose' },
  ),
)

// 서버에 등록한 뒤 기기에 반영. 끼니 연결은 끼니 API 전까지 기기에서만 붙임
export async function saveRecord(target: MeasureTarget, value: number, measuredAt: Date) {
  const saved = await createReading(target, value, measuredAt)
  const record = { ...saved, mealId: target.mealId, mealType: target.mealType ?? saved.mealType }
  useGlucoseStore.getState().addRecord(record)
  return record
}
