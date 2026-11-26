import { apiClient, type BaseResponse } from '@/api/axios'
import type { MealItemSummary } from '@/api/mealItems'
import { fromServerMeal, type ServerMeal, type ServerMealSlot } from '@/api/meals'
import {
  fromServerReading,
  type ReadingType,
  type ServerJudgment,
  type ServerSlot,
} from '@/api/readings'
import type { GlucoseRecord } from '@/types/glucose'
import { addDays, parseDateKey, toDateKey } from '@/utils/date'

// 백엔드 RecordEventResponse. type에 맞는 칸(reading 또는 meal) 하나만 옴
type RecordEventResponse = {
  type: 'READING' | 'MEAL'
  id: number
  occurredAt: string
  reading?: {
    value: number
    readingType: ReadingType
    slot: ServerSlot | null
    mealId: number | null
    criteriaVersionId: number
  } & ServerJudgment
  meal?: {
    mealSlot: ServerMealSlot
    startedOffline: boolean
    note: string | null
    items: MealItemSummary[]
  }
}

// 백엔드 RecordsResponse. 기록 없는 날도 events=[]로 옴
type RecordsResponse = {
  from: string
  to: string
  days: { date: string; events: RecordEventResponse[] }[]
}

// from~to(둘 다 포함, 최대 31일) 혈당 · 식사. range.to는 다음 날 00:00(포함 안 함)
export async function getRecords(from: Date, to: Date) {
  const { data } = await apiClient.get<BaseResponse<RecordsResponse>>('/records', {
    params: { from: toDateKey(from), to: toDateKey(to) },
  })
  if (!data.data) throw new Error('기록 조회 응답이 비어 있음')
  const events = data.data.days.flatMap((day) => day.events)
  const meals: ServerMeal[] = []
  const records: GlucoseRecord[] = []
  events.forEach((event) => {
    if (event.type === 'MEAL' && event.meal) {
      const meal = fromServerMeal({
        mealId: event.id,
        mealSlot: event.meal.mealSlot,
        startedAt: event.occurredAt,
        items: event.meal.items,
      })
      if (meal) meals.push(meal)
    }
    if (event.type === 'READING' && event.reading) {
      records.push({
        ...fromServerReading({
          readingId: event.id,
          measuredAt: event.occurredAt,
          ...event.reading,
        }),
        criteriaId: event.reading.criteriaVersionId,
      })
    }
  })
  return { range: { from, to: addDays(to, 1) }, meals, records }
}

// 백엔드 CalendarDayStatus
export type CalendarDayStatus = 'RECORDED' | 'EMPTY' | 'TODAY' | 'FUTURE' | 'BEFORE_SIGNUP'

// 백엔드 CalendarResponse. visit은 진료 일정 기능 전이라 항상 false여서 안 씀
type CalendarResponse = {
  month: string
  firstRecordDate: string | null
  hasPrevMonth: boolean
  hasNextMonth: boolean
  days: { date: string; status: CalendarDayStatus; visit: boolean }[]
}

// 기록 달력 한 달. statuses는 날짜 키(2026-10-14)별 상태
export async function getRecordCalendar(month: Date) {
  const { data } = await apiClient.get<BaseResponse<CalendarResponse>>('/records/calendar', {
    params: { month: toDateKey(month).slice(0, 7) },
  })
  const calendar = data.data
  if (!calendar) throw new Error('기록 달력 응답이 비어 있음')
  return {
    statuses: new Map(calendar.days.map((day) => [day.date, day.status])),
    firstRecordDate: parseDateKey(calendar.firstRecordDate),
    hasPrevMonth: calendar.hasPrevMonth,
    hasNextMonth: calendar.hasNextMonth,
  }
}
