import { apiClient, type BaseResponse } from '@/api/axios'
import type { MealItemSummary } from '@/api/mealItems'
import { fromServerMeal, type ServerMeal, type ServerMealSlot } from '@/api/meals'
import {
  fromServerReading,
  type ReadingType,
  type ServerJudgment,
  type ServerSlot,
} from '@/api/readings'
import { fromServerInsulin, type ServerInsulinType } from '@/api/insulin'
import type { GlucoseRecord, InsulinRecord } from '@/types/glucose'
import { addDays, parseDateKey, toDateKey } from '@/utils/date'

// 백엔드 RecordEventResponse. type에 맞는 칸(reading · meal · insulin) 하나만 옴
type RecordEventResponse = {
  type: 'READING' | 'MEAL' | 'INSULIN'
  id: number
  occurredAt: string
  // 저장한 뒤 고친 적이 있는지
  modified?: boolean
  insulin?: { insulinType: ServerInsulinType; mealSlot: ServerMealSlot | null; units: number }
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

// from~to(둘 다 포함, 최대 31일) 혈당 · 식사 · 인슐린. range.to는 다음 날 00:00(포함 안 함)
export async function getRecords(from: Date, to: Date) {
  const { data } = await apiClient.get<BaseResponse<RecordsResponse>>('/records', {
    params: { from: toDateKey(from), to: toDateKey(to) },
  })
  if (!data.data) throw new Error('기록 조회 응답이 비어 있음')
  const events = data.data.days.flatMap((day) => day.events)
  const meals: ServerMeal[] = []
  const records: GlucoseRecord[] = []
  const insulins: InsulinRecord[] = []
  events.forEach((event) => {
    if (event.type === 'INSULIN' && event.insulin) {
      insulins.push(
        fromServerInsulin({
          insulinLogId: event.id,
          ...event.insulin,
          takenAt: event.occurredAt,
          // 고친 시각은 안 와서 고친 적 있는지만 표시
          editedAt: event.modified ? event.occurredAt : null,
        }),
      )
    }
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
  return { range: { from, to: addDays(to, 1) }, meals, records, insulins }
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

// 백엔드 기간 지우기 응답
type RecordsDeleteResponse = {
  deletedReadings: number
  deletedMeals: number
  deletedInsulinLogs: number
}

// 서버가 한 번에 지우는 최대 기간(양 끝 포함 366일)
const DELETE_MAX_DAYS = 366

// from~to(둘 다 포함) 혈당 · 식사 · 인슐린을 같이 지움. 366일보다 길면 나눠서 보내고 개수를 더함
export async function deleteRecordsRange(from: Date, to: Date) {
  const total = { readings: 0, meals: 0, insulins: 0 }
  for (let start = from; start <= to; start = addDays(start, DELETE_MAX_DAYS)) {
    const end = addDays(start, DELETE_MAX_DAYS - 1)
    const { data } = await apiClient.delete<BaseResponse<RecordsDeleteResponse>>('/records', {
      params: { from: toDateKey(start), to: toDateKey(end < to ? end : to) },
    })
    total.readings += data.data?.deletedReadings ?? 0
    total.meals += data.data?.deletedMeals ?? 0
    total.insulins += data.data?.deletedInsulinLogs ?? 0
  }
  return total
}
