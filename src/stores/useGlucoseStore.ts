import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getErrorCode } from '@/api/axios'
import { applyMealItems, toMealContent } from '@/api/mealItems'
import { createMeal, getAllMeals, type ServerMeal } from '@/api/meals'
import { createReading, deleteReading, getAllReadings, updateReading } from '@/api/readings'
import type {
  GlucoseRecord,
  InsulinRecord,
  Meal,
  MealType,
  MeasureTarget,
  NutritionEdits,
  Portion,
} from '@/types/glucose'
import { useFoodStore } from '@/stores/useFoodStore'

type InsulinInput = Pick<InsulinRecord, 'kind' | 'name' | 'units' | 'takenAt'>

type GlucoseState = {
  meals: Meal[]
  records: GlucoseRecord[]
  // 기기에 먼저 적고 임시 id를 돌려줌
  startMeal: (type: MealType, now?: Date) => string
  skipMeal: (mealId: string) => void
  // nutritionEdits를 안 넘기면 원래 고친 값 유지
  setMealContent: (
    mealId: string,
    foods: string[],
    portion?: Portion,
    nutritionEdits?: NutritionEdits,
    stapleGrams?: number,
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

// 서버 기록을 기기(localStorage)에도 둠
export const useGlucoseStore = create<GlucoseState>()(
  persist(
    (set) => ({
      meals: [],
      records: [],
      startMeal: (type, now = new Date()) => {
        const id = crypto.randomUUID()
        set((state) => ({
          meals: [
            ...state.meals,
            { id, type, startedAt: now.toISOString(), skipped: false, pending: true },
          ],
        }))
        return id
      },
      skipMeal: (mealId) =>
        set((state) => ({
          meals: state.meals.map((meal) =>
            meal.id === mealId ? { ...meal, skipped: true } : meal,
          ),
        })),
      setMealContent: (mealId, foods, portion, nutritionEdits, stapleGrams) =>
        set((state) => ({
          meals: state.meals.map((meal) =>
            meal.id === mealId
              ? {
                  ...meal,
                  foods,
                  portion,
                  stapleGrams,
                  nutritionEdits: keepEdits(nutritionEdits ?? meal.nutritionEdits, foods),
                  itemsPending: true,
                }
              : meal,
          ),
        })),
      setMealPhotoInfo: (mealId, info) =>
        set((state) => ({
          meals: state.meals.map((meal) =>
            meal.id === mealId ? { ...meal, ...info, itemsPending: true } : meal,
          ),
        })),
      // 서버 동기화로 같은 기록이 먼저 들어왔으면 바꿔 끼움
      addRecord: (record) =>
        set((state) => ({
          records: [...state.records.filter((item) => item.id !== record.id), record],
        })),
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

// 기기에만 있던 식사를 서버에 보내고 서버 id로 바꿈. 실패하면 pending 그대로
async function sendPendingMeal(meal: Meal, offline: boolean) {
  try {
    const saved = await createMeal(meal.type, new Date(meal.startedAt), offline)
    useGlucoseStore.setState((state) => ({
      // 서버 동기화로 같은 식사가 먼저 들어왔으면 음식 정보가 있는 기기 쪽만 남김
      meals: state.meals
        .filter((item) => item.id !== saved.id)
        .map((item) =>
          item.id === meal.id ? { ...item, id: saved.id, pending: undefined } : item,
        ),
      // 그사이 이 끼니에 붙인 혈당 기록도 서버 id로
      records: state.records.map((record) =>
        record.mealId === meal.id ? { ...record, mealId: saved.id } : record,
      ),
    }))
    // 못 보낸 사이 적은 음식도 이어서 보냄
    void pushMealItems(saved.id)
    return true
  } catch {
    return false
  }
}

// 음식 이름으로 코드 · 주식 여부 · 내 음식 영양값을 다시 찾을 목록
const getKnownFoods = () => {
  const { myFoods, pickedFoods } = useFoodStore.getState()
  return [...myFoods, ...pickedFoods]
}

// 서버 식사를 기기 식사에 합침. 기기에서 고치고 못 보낸 음식은 기기 값, 아니면 서버 항목
export function mergeServerMeal(server: ServerMeal, local?: Meal): Meal {
  const { items, ...base } = server
  const meal: Meal = local ? { ...local, ...base } : { ...base, skipped: false }
  if (!items || meal.itemsPending) return meal
  // 항목 API 전에 기기에만 적은 음식은 서버로 옮김
  if (items.length === 0) return meal.foods?.length ? { ...meal, itemsPending: true } : meal
  return { ...meal, ...toMealContent(items, getKnownFoods(), meal.startedAt) }
}

// 같은 식사를 동시에 맞추면 항목이 두 번 생겨서 차례로
const pushing = new Map<string, Promise<boolean>>()

async function pushMealItemsOnce(mealId: string) {
  const meal = useGlucoseStore.getState().meals.find((item) => item.id === mealId)
  if (!meal || meal.pending || !meal.itemsPending) return true
  try {
    await applyMealItems(meal, getKnownFoods())
  } catch (error) {
    // 서버에서 지운 식사면 더 보내지 않음
    if (getErrorCode(error) !== 'MEAL_40401') return false
  }
  // 보내는 사이 또 고쳤으면 다음 차례에 다시 보냄. 동기화로 객체만 바뀐 건 같은 내용으로 봄
  const same = (item: Meal) =>
    item.foods === meal.foods &&
    item.portion === meal.portion &&
    item.stapleGrams === meal.stapleGrams &&
    item.portions === meal.portions &&
    item.nutritionEdits === meal.nutritionEdits
  useGlucoseStore.setState((state) => ({
    meals: state.meals.map((item) =>
      item.id === mealId && same(item) ? { ...item, itemsPending: undefined } : item,
    ),
  }))
  return true
}

// 기기 끼니 내용을 서버 항목으로 맞춤. 실패하면 itemsPending으로 남겨 동기화 때 다시
export function pushMealItems(mealId: string) {
  const prev = pushing.get(mealId) ?? Promise.resolve(true)
  const next = prev.then(() => pushMealItemsOnce(mealId))
  pushing.set(mealId, next)
  void next.finally(() => {
    if (pushing.get(mealId) === next) pushing.delete(mealId)
  })
  return next
}

// 끼니 내용은 기기에 먼저 적고 서버에 보냄. 못 보낸 식사면 식사를 보낼 때 같이
export function saveMealContent(
  mealId: string,
  foods: string[],
  portion?: Portion,
  nutritionEdits?: NutritionEdits,
  stapleGrams?: number,
) {
  useGlucoseStore.getState().setMealContent(mealId, foods, portion, nutritionEdits, stapleGrams)
  return pushMealItems(mealId)
}

// 식사 시작은 원탭이라 기기에 먼저 적고 서버에 보냄. 실패하면 pending으로 남겨 동기화 때 다시 보냄
export async function saveMealStart(type: MealType, now = new Date()) {
  const id = useGlucoseStore.getState().startMeal(type, now)
  const meal = useGlucoseStore.getState().meals.find((item) => item.id === id)
  return meal ? sendPendingMeal(meal, false) : false
}

// 못 보낸 식사를 먼저 보내고 서버 식사로 바꿈. 음식·양·건너뜀처럼 기기에만 있는 정보는 같은 식사에 다시 붙임
export async function syncMeals() {
  const pending = useGlucoseStore.getState().meals.filter((meal) => meal.pending)
  for (const meal of pending) await sendPendingMeal(meal, true)
  const server = await getAllMeals()
  useGlucoseStore.setState((state) => {
    const local = new Map(state.meals.map((meal) => [meal.id, meal]))
    const synced = server.map((meal) => mergeServerMeal(meal, local.get(meal.id)))
    // 또 못 보낸 식사는 기기에 남겨 다음에 다시 보냄
    const stillPending = state.meals.filter((meal) => meal.pending)
    return {
      meals: [...synced, ...stillPending].sort(
        (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
      ),
    }
  })
  const unsent = useGlucoseStore.getState().meals.filter((meal) => meal.itemsPending)
  await Promise.all(unsent.map((meal) => pushMealItems(meal.id)))
}

// 서버에 등록한 뒤 기기에 반영. 서버에 있는 식사면 끼니도 서버에 연결, 못 보낸 식사면 기기에서만
export async function saveRecord(target: MeasureTarget, value: number, measuredAt: Date) {
  const meal = useGlucoseStore.getState().meals.find((item) => item.id === target.mealId)
  const serverMealId = meal && !meal.pending ? meal.id : undefined
  const saved = await createReading(target, value, measuredAt, serverMealId)
  const record = {
    ...saved,
    mealId: saved.mealId ?? target.mealId,
    mealType: target.mealType ?? saved.mealType,
  }
  useGlucoseStore.getState().addRecord(record)
  return record
}

// 서버 기록으로 바꿈. 처음 값은 기기에서, 끼니 연결은 서버에 없을 때만 기기 값으로
export async function syncRecords() {
  const server = await getAllReadings()
  useGlucoseStore.setState((state) => {
    const local = new Map(state.records.map((record) => [record.id, record]))
    return {
      records: server.map((record) => {
        const prev = local.get(record.id)
        if (!prev) return record
        return {
          ...record,
          mealId: record.mealId ?? prev.mealId,
          mealType: record.mealType ?? prev.mealType,
          original: prev.original,
        }
      }),
    }
  })
}

// 기간 하나의 서버 기록. to는 포함 안 함
type ServerRangeData = {
  range: { from: Date; to: Date }
  meals: ServerMeal[]
  records: GlucoseRecord[]
}

const toTime = (iso: string) => new Date(iso).getTime()

// 기간 하나만 서버 기록으로 맞춤. 음식 · 건너뜀 · 처음 값처럼 기기에만 있는 정보는 유지
// 요청 전에 있던 기록 중 응답에 없는 것만 지움(서버에서 지운 것). 요청하는 사이 새로 적은 건 남김
export async function syncServerRange<T extends ServerRangeData>(load: () => Promise<T>) {
  const before = useGlucoseStore.getState()
  const knownMeals = new Set(before.meals.map((meal) => meal.id))
  const knownRecords = new Set(before.records.map((record) => record.id))
  const data = await load()
  const { from, to } = data.range
  const inRange = (iso: string) => {
    const time = new Date(iso)
    return time >= from && time < to
  }

  useGlucoseStore.setState((state) => {
    const serverMeals = new Map(data.meals.map((meal) => [meal.id, meal]))
    const keptMeals = state.meals.filter(
      (meal) =>
        meal.pending ||
        !inRange(meal.startedAt) ||
        !knownMeals.has(meal.id) ||
        serverMeals.has(meal.id),
    )
    const localMealIds = new Set(keptMeals.map((meal) => meal.id))
    const meals = [
      ...keptMeals.map((meal) => {
        const server = serverMeals.get(meal.id)
        return server ? mergeServerMeal(server, meal) : meal
      }),
      ...data.meals
        .filter((meal) => !localMealIds.has(meal.id))
        .map((meal) => mergeServerMeal(meal)),
    ].sort((a, b) => toTime(a.startedAt) - toTime(b.startedAt))

    const serverRecords = new Map(data.records.map((record) => [record.id, record]))
    const keptRecords = state.records.filter(
      (record) =>
        !inRange(record.measuredAt) || !knownRecords.has(record.id) || serverRecords.has(record.id),
    )
    const localRecordIds = new Set(keptRecords.map((record) => record.id))
    const records = [
      ...keptRecords.map((record) => {
        const server = serverRecords.get(record.id)
        // 끼니 연결은 서버에 없을 때만 기기 값으로
        return server
          ? {
              ...record,
              ...server,
              mealId: server.mealId ?? record.mealId,
              mealType: server.mealType ?? record.mealType,
            }
          : record
      }),
      ...data.records.filter((record) => !localRecordIds.has(record.id)),
    ].sort((a, b) => toTime(a.measuredAt) - toTime(b.measuredAt))

    return { meals, records }
  })
  return data
}

// 서버에서 고친 뒤 기기에 반영. 처음 값(original)은 기기에서 남김
export async function editRecord(id: string, changes: { value: number; measuredAt: string }) {
  await updateReading(id, changes)
  useGlucoseStore.getState().updateRecord(id, changes)
}

// 서버에서 지운 뒤 기기에서도 뺌
export async function removeRecord(id: string) {
  await deleteReading(id)
  useGlucoseStore.getState().deleteRecord(id)
}
