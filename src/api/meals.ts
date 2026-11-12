import { apiClient, type BaseResponse } from '@/api/axios'
import type { Meal, MealType } from '@/types/glucose'
import { toDateKey } from '@/utils/date'

// 백엔드 MealSlot. 간식(SNACK)은 프론트 끼니에 없음
type ServerMealSlot = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'

// 백엔드 MealResponse
type MealResponse = {
  mealId: number
  mealSlot: ServerMealSlot
  startedAt: string
  startedOffline: boolean
  note: string | null
  createdAt: string
  updatedAt: string
}

const MEAL_SLOT: Record<MealType, ServerMealSlot> = {
  breakfast: 'BREAKFAST',
  lunch: 'LUNCH',
  dinner: 'DINNER',
}

const MEAL_FROM_SLOT: Partial<Record<ServerMealSlot, MealType>> = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
}

// 식사 시작 등록. 서버가 병원 기준 시간 뒤 측정 알림을 예약함. 늦게 보내는 건 offline
export async function createMeal(type: MealType, startedAt: Date, offline = false) {
  const { data } = await apiClient.post<BaseResponse<MealResponse>>('/meals', {
    mealSlot: MEAL_SLOT[type],
    startedAt: startedAt.toISOString(),
    startedOffline: offline,
  })
  if (!data.data) throw new Error('식사 등록 응답이 비어 있음')
  return { id: String(data.data.mealId), startedAt: data.data.startedAt }
}

// 백엔드 MealPageResponse
type MealPageResponse = {
  items: MealResponse[]
  hasNext: boolean
  nextCursorAt: string | null
  nextCursorId: number | null
}

// 한 번에 받을 수 있는 최대 개수(서버 상한 100)
const PAGE_SIZE = 100
// 관리 기간이 몇 달이라 처음부터 오늘까지 전부 받음
const ALL_FROM = '2000-01-01'

type Cursor = { cursorAt: string; cursorId: number }

// 한 페이지. 다음 페이지는 받은 커서를 그대로 보냄
async function getMealPage(cursor: Cursor | null) {
  const { data } = await apiClient.get<BaseResponse<MealPageResponse>>('/meals', {
    params: { from: ALL_FROM, to: toDateKey(new Date()), size: PAGE_SIZE, ...cursor },
  })
  return data.data
}

// 내 식사 전부. 서버는 최신순 → 화면은 오래된 순. 간식은 프론트 끼니에 없어 뺌
export async function getAllMeals() {
  const meals: Pick<Meal, 'id' | 'type' | 'startedAt'>[] = []
  let cursor: Cursor | null = null
  do {
    const page = await getMealPage(cursor)
    if (!page) break
    page.items.forEach((item) => {
      const type = MEAL_FROM_SLOT[item.mealSlot]
      if (type) meals.push({ id: String(item.mealId), type, startedAt: item.startedAt })
    })
    cursor =
      page.hasNext && page.nextCursorAt && page.nextCursorId !== null
        ? { cursorAt: page.nextCursorAt, cursorId: page.nextCursorId }
        : null
  } while (cursor)
  return meals.reverse()
}
