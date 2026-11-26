import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getErrorCode } from '@/api/axios'
import {
  createInsulinLog,
  deleteInsulinLog,
  getInsulinLogs,
  updateInsulinLog,
  type InsulinInput,
} from '@/api/insulin'
import { applyMealItems, toMealContent } from '@/api/mealItems'
import { createMeal, deleteMeal, getAllMeals, updateMealStart, type ServerMeal } from '@/api/meals'
import {
  createReading,
  deleteReading,
  getAllReadings,
  updateReading,
  type ReadingChanges,
} from '@/api/readings'
import { getRecords } from '@/api/records'
import type {
  GlucoseRecord,
  InsulinRecord,
  Meal,
  MealType,
  MeasureTarget,
  MeterLimit,
  NutritionEdits,
  Portion,
} from '@/types/glucose'
import { useFoodStore } from '@/stores/useFoodStore'
import { addDays, startOfDay } from '@/utils/date'

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
  updateRecord: (id: string, changes: { value?: number; measuredAt: string }, now?: Date) => void
  deleteRecord: (id: string, now?: Date) => void
  // 지운 기록. 화면·리포트에선 빼고 기록용으로만 보관
  deletedRecords: (GlucoseRecord & { deletedAt: string })[]
  insulins: InsulinRecord[]
  // 이 기기에서 기록을 전부 받아 둔 계정. 같은 계정이면 앱 켤 때 최근 기간만 받음
  syncedUserId: number | null
  // 인슐린을 전부 받아 둔 계정. 혈당 · 식사와 따로, 실패하면 다음에 다시 전부
  insulinSyncedUserId: number | null
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
                  // 값을 안 보냈으면(HI · LO 그대로 시각만) 값은 그대로
                  ...(changes.value !== undefined && { value: changes.value }),
                  measuredAt: changes.measuredAt,
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
      syncedUserId: null,
      insulinSyncedUserId: null,
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
  await sendPendingMeals()
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
  await pushUnsentItems()
}

// 못 보낸 식사를 서버로. 실패한 식사는 pending 그대로
async function sendPendingMeals() {
  const pending = useGlucoseStore.getState().meals.filter((meal) => meal.pending)
  for (const meal of pending) await sendPendingMeal(meal, true)
}

// 못 보낸 음식 · 양을 서버 식사에 다시 붙임
async function pushUnsentItems() {
  const unsent = useGlucoseStore.getState().meals.filter((meal) => meal.itemsPending)
  await Promise.all(unsent.map((meal) => pushMealItems(meal.id)))
}

// 받는 사이 지운 · 고친 인슐린. 늦게 온 응답이 되살리거나 고치기 전 값으로 덮지 않게
const removedInsulinIds = new Set<string>()
const insulinEditedAt = new Map<string, number>()

// 서버 인슐린을 기기 목록에 합침. 예전 기록 · 요청 중 새로 적은 건 남기고, 요청 전에 있던 것 중 서버에 없는 것만 뺌
function mergeInsulins(
  local: InsulinRecord[],
  server: InsulinRecord[],
  inRange: (iso: string) => boolean,
  known: Set<string>,
  startedAt: number,
) {
  const fresh = server.filter((insulin) => !removedInsulinIds.has(insulin.id))
  const serverById = new Map(fresh.map((insulin) => [insulin.id, insulin]))
  const editedSince = (id: string) => (insulinEditedAt.get(id) ?? 0) >= startedAt
  const kept = local.filter(
    (insulin) =>
      !insulin.server ||
      !inRange(insulin.takenAt) ||
      !known.has(insulin.id) ||
      serverById.has(insulin.id) ||
      editedSince(insulin.id),
  )
  const keptIds = new Set(kept.map((insulin) => insulin.id))
  return [
    ...kept.map((insulin) =>
      editedSince(insulin.id) ? insulin : (serverById.get(insulin.id) ?? insulin),
    ),
    ...fresh.filter((insulin) => !keptIds.has(insulin.id)),
  ].sort((a, b) => toTime(a.takenAt) - toTime(b.takenAt))
}

// 서버 인슐린 전부로 바꿈. 서버 연동 전 기기에만 있던 기록 · 요청 중 새로 적은 건 남김
async function syncAllInsulins() {
  const known = new Set(useGlucoseStore.getState().insulins.map((insulin) => insulin.id))
  const startedAt = Date.now()
  const server = await getInsulinLogs(new Date(ALL_FROM_YEAR, 0, 1), new Date())
  useGlucoseStore.setState((state) => ({
    insulins: mergeInsulins(state.insulins, server, () => true, known, startedAt),
  }))
}

// 서버가 받는 가장 이른 해(2000년)
const ALL_FROM_YEAR = 2000
// 앱 켤 때 받는 최근 기간. 서버 기간 조회 상한(31일)
export const RANGE_MAX_DAYS = 31

// from~to(둘 다 포함, 최대 31일) 혈당 · 식사 · 인슐린을 서버와 맞춤. 인슐린만 실패하면 혈당 · 식사만 맞춤
export function syncRange(from: Date, to: Date) {
  return syncServerRange(async () => {
    const [records, insulins] = await Promise.all([
      getRecords(from, to),
      getInsulinLogs(from, to).catch(() => undefined),
    ])
    return { ...records, insulins }
  })
}

// 앱 켤 때 · 로그인 뒤. 이 기기에서 이 계정을 처음 받으면(계정이 바뀌어도) 전부, 그 뒤로는 최근 31일만
export async function syncGlucose(userId: number) {
  const { syncedUserId, insulinSyncedUserId } = useGlucoseStore.getState()
  if (syncedUserId !== userId) {
    // 다른 계정 인슐린은 예전 기록까지 바로 비움. 혈당 · 식사는 전부 받으며 바뀜
    if (syncedUserId !== null) useGlucoseStore.setState({ insulins: [], insulinSyncedUserId: null })
    // 인슐린이 실패해도 혈당 · 식사는 받아 둔 것으로
    await Promise.all([syncMeals(), syncRecords(), syncInsulinsOnce(userId)])
    useGlucoseStore.setState({ syncedUserId: userId })
    return
  }
  // 인슐린을 아직 전부 못 받았으면 다시 시도
  const insulinJob = insulinSyncedUserId === userId ? undefined : syncInsulinsOnce(userId)
  await sendPendingMeals()
  const today = startOfDay(new Date())
  await syncRange(addDays(today, -(RANGE_MAX_DAYS - 1)), today)
  await pushUnsentItems()
  await insulinJob
}

// 인슐린 전부 받기. 성공했을 때만 받아 둔 계정으로 기록
async function syncInsulinsOnce(userId: number) {
  try {
    await syncAllInsulins()
    useGlucoseStore.setState({ insulinSyncedUserId: userId })
  } catch {
    // 다음에 앱 켤 때 다시 전부 받음
  }
}

// 서버에 등록한 뒤 기기에 반영. 서버에 있는 식사면 끼니도 서버에 연결, 못 보낸 식사면 기기에서만
// value가 HI · LO면 혈당계 글자로 저장
export async function saveRecord(
  target: MeasureTarget,
  value: number | MeterLimit,
  measuredAt: Date,
) {
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

// 서버에 인슐린을 저장한 뒤 기기에도 추가
export async function saveInsulin(input: InsulinInput) {
  const saved = await createInsulinLog(input)
  useGlucoseStore.setState((state) => ({
    insulins: [...state.insulins, saved].sort((a, b) => toTime(a.takenAt) - toTime(b.takenAt)),
  }))
  return saved
}

// 서버에서 이미 지운 인슐린(다른 기기 등). 기기에서도 뺌
const isInsulinGone = (error: unknown) => getErrorCode(error) === 'INSULIN_40401'

const dropInsulin = (id: string) =>
  useGlucoseStore.setState((state) => ({
    insulins: state.insulins.filter((insulin) => insulin.id !== id),
  }))

// 서버 인슐린을 고친 뒤 기기에도 반영. 서버에 없으면 기기에서 빼고 에러를 그대로 던짐
export async function editInsulin(id: string, input: InsulinInput) {
  try {
    const saved = await updateInsulinLog(id, input)
    insulinEditedAt.set(id, Date.now())
    useGlucoseStore.setState((state) => ({
      insulins: state.insulins
        .map((insulin) => (insulin.id === id ? saved : insulin))
        .sort((a, b) => toTime(a.takenAt) - toTime(b.takenAt)),
    }))
    return saved
  } catch (error) {
    if (isInsulinGone(error)) {
      removedInsulinIds.add(id)
      dropInsulin(id)
    }
    throw error
  }
}

// 서버 인슐린을 지운 뒤 기기에서도 뺌. 이미 지운 기록이면 지운 것으로 봄
export async function removeInsulin(id: string) {
  try {
    await deleteInsulinLog(id)
  } catch (error) {
    if (!isInsulinGone(error)) throw error
  }
  removedInsulinIds.add(id)
  dropInsulin(id)
}

// 기간 하나의 서버 기록. to는 포함 안 함. 인슐린은 받아 온 화면만
type ServerRangeData = {
  range: { from: Date; to: Date }
  meals: ServerMeal[]
  records: GlucoseRecord[]
  insulins?: InsulinRecord[]
}

const toTime = (iso: string) => new Date(iso).getTime()

// 기간 하나만 서버 기록으로 맞춤. 음식 · 건너뜀 · 처음 값처럼 기기에만 있는 정보는 유지
// 요청 전에 있던 기록 중 응답에 없는 것만 지움(서버에서 지운 것). 요청하는 사이 새로 적은 건 남김
export async function syncServerRange<T extends ServerRangeData>(load: () => Promise<T>) {
  const before = useGlucoseStore.getState()
  const knownMeals = new Set(before.meals.map((meal) => meal.id))
  const knownRecords = new Set(before.records.map((record) => record.id))
  const knownInsulins = new Set(before.insulins.map((insulin) => insulin.id))
  const startedAt = Date.now()
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

    if (!data.insulins) return { meals, records }
    const insulins = mergeInsulins(state.insulins, data.insulins, inRange, knownInsulins, startedAt)
    return { meals, records, insulins }
  })
  return data
}

// 서버에서 고친 뒤 서버가 다시 판정한 값으로 바꿈. 처음 값(original) · 서버에 없는 끼니 연결은 기기 값 유지
// 다른 기기에서 먼저 고쳤으면(409) 그날 기록을 다시 받고 에러를 그대로 던짐
// 시점을 바꾸면 끼니 연결도 서버 값 그대로(공복 · 자기 전이면 끊김)
export async function editRecord(id: string, changes: ReadingChanges) {
  try {
    const saved = await updateReading(id, changes)
    useGlucoseStore.getState().updateRecord(id, changes)
    useGlucoseStore.setState((state) => ({
      records: state.records.map((record) =>
        record.id === id
          ? {
              ...record,
              ...saved,
              mealId: changes.target ? saved.mealId : (saved.mealId ?? record.mealId),
              mealType: changes.target
                ? (changes.target.mealType ?? saved.mealType)
                : (saved.mealType ?? record.mealType),
            }
          : record,
      ),
    }))
  } catch (error) {
    if (getErrorCode(error) === 'READING_40903') {
      const day = startOfDay(new Date(changes.measuredAt))
      await syncRange(day, day).catch(() => {})
    }
    throw error
  }
}

// 같은 끼니의 시작 시각 고치기는 차례로. 늦게 끝난 앞 요청이 마지막에 고른 시각을 덮지 않게
const mealStartQueue = new Map<string, Promise<void>>()

// 식사 시작 시각 고치기. 아직 서버에 안 간 끼니는 기기에서만
export async function editMealStart(id: string, startedAt: Date) {
  const run = (mealStartQueue.get(id) ?? Promise.resolve())
    .catch(() => {})
    .then(async () => {
      const meal = useGlucoseStore.getState().meals.find((item) => item.id === id)
      if (!meal) return
      if (!meal.pending) await updateMealStart(id, startedAt)
      useGlucoseStore.setState((state) => ({
        meals: state.meals
          .map((item) => (item.id === id ? { ...item, startedAt: startedAt.toISOString() } : item))
          .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()),
      }))
    })
  mealStartQueue.set(id, run)
  try {
    await run
  } finally {
    if (mealStartQueue.get(id) === run) mealStartQueue.delete(id)
  }
}

// 서버에서 지운 뒤 기기에서도 뺌. 아직 서버에 안 간 끼니는 기기에서만
export async function removeMeal(id: string) {
  const meal = useGlucoseStore.getState().meals.find((item) => item.id === id)
  if (meal && !meal.pending) await deleteMeal(id)
  useGlucoseStore.setState((state) => ({ meals: state.meals.filter((item) => item.id !== id) }))
}

// 서버에서 지운 뒤 기기에서도 뺌
export async function removeRecord(id: string) {
  await deleteReading(id)
  useGlucoseStore.getState().deleteRecord(id)
}
