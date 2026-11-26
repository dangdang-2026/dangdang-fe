import { apiClient, type BaseResponse } from '@/api/axios'
import { fromServerInsulin, type InsulinLogResponse } from '@/api/insulin'
import { fromServerMeal, type MealResponse } from '@/api/meals'
import { fromServerReading, type ReadingType, type ServerSlot } from '@/api/readings'
import { addDays, parseDateKey } from '@/utils/date'

// 백엔드 TodayReadingResponse. timing · aboveTarget은 화면이 직접 판단해서 안 씀
type TodayReadingResponse = {
  readingId: number
  value: number
  readingType: ReadingType
  slot: ServerSlot | null
  mealId: number | null
  measuredAt: string
}

// 백엔드 TodayResponse. 기준 · 다음 알림은 다른 API로 받고 있어 안 씀
type TodayResponse = {
  date: string
  meals: MealResponse[]
  readings: TodayReadingResponse[]
  insulinLogs: InsulinLogResponse[]
  pushReady: boolean
}

// 오늘 화면 재료. range는 서버 기준 오늘(한국 00:00 ~ 다음 날 00:00 전)
export async function getToday() {
  const { data } = await apiClient.get<BaseResponse<TodayResponse>>('/today')
  const today = data.data
  if (!today) throw new Error('오늘 화면 응답이 비어 있음')
  const from = parseDateKey(today.date)
  if (!from) throw new Error('오늘 날짜 형식이 다름')
  return {
    range: { from, to: addDays(from, 1) },
    meals: today.meals.flatMap((item) => fromServerMeal(item) ?? []),
    records: today.readings.map((item) => fromServerReading(item)),
    insulins: today.insulinLogs.map(fromServerInsulin),
    pushReady: today.pushReady,
  }
}
