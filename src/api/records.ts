import { apiClient, type BaseResponse } from '@/api/axios'
import { fromServerMeal, type ServerMealSlot } from '@/api/meals'
import { fromServerReading, type ReadingType, type ServerSlot } from '@/api/readings'
import type { GlucoseRecord, Meal } from '@/types/glucose'
import { addDays, toDateKey } from '@/utils/date'

// 백엔드 RecordEventResponse. type에 맞는 칸(reading 또는 meal) 하나만 옴
type RecordEventResponse = {
  type: 'READING' | 'MEAL'
  id: number
  occurredAt: string
  modified: boolean
  reading?: {
    value: number
    readingType: ReadingType
    slot: ServerSlot | null
    mealId: number | null
    criteriaVersionId: number
    scheduledAt: string | null
    enteredLate: boolean
  }
  meal?: {
    mealSlot: ServerMealSlot
    startedOffline: boolean
    note: string | null
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
  const meals: Pick<Meal, 'id' | 'type' | 'startedAt'>[] = []
  const records: GlucoseRecord[] = []
  events.forEach((event) => {
    if (event.type === 'MEAL' && event.meal) {
      const meal = fromServerMeal({
        mealId: event.id,
        mealSlot: event.meal.mealSlot,
        startedAt: event.occurredAt,
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
