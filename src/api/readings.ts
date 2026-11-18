import { apiClient, type BaseResponse } from '@/api/axios'
import type { GlucoseRecord, MealType, MeasureTarget } from '@/types/glucose'
import { parseDateKey, toDateKey } from '@/utils/date'
import type { DateRange, PeriodStats, StatsSlot } from '@/utils/stats'

// 백엔드 ReadingType · MeasureSlot
export type ReadingType = 'FASTING' | 'POST_MEAL' | 'OTHER'
export type ServerSlot = 'FASTING' | 'BREAKFAST_AFTER' | 'LUNCH_AFTER' | 'DINNER_AFTER' | 'BEDTIME'

// 백엔드 ReadingResponse
type ReadingResponse = {
  readingId: number
  value: number
  measuredAt: string
  readingType: ReadingType
  slot: ServerSlot | null
  criteriaVersionId: number
  mealId: number | null
  enteredLate: boolean
  createdAt: string
  updatedAt: string
}

const MEAL_SLOT: Record<MealType, ServerSlot> = {
  breakfast: 'BREAKFAST_AFTER',
  lunch: 'LUNCH_AFTER',
  dinner: 'DINNER_AFTER',
}

const MEAL_FROM_SLOT: Partial<Record<ServerSlot, MealType>> = {
  BREAKFAST_AFTER: 'breakfast',
  LUNCH_AFTER: 'lunch',
  DINNER_AFTER: 'dinner',
}

// 공복 → FASTING, 식후 → POST_MEAL + 끼니, 자기 전 → OTHER + BEDTIME
function toServerType(target: Pick<MeasureTarget, 'slot' | 'mealType'>) {
  if (target.slot === 'fasting') return { readingType: 'FASTING', slot: 'FASTING' } as const
  if (target.slot === 'bedtime') return { readingType: 'OTHER', slot: 'BEDTIME' } as const
  return {
    readingType: 'POST_MEAL',
    slot: target.mealType ? MEAL_SLOT[target.mealType] : null,
  } as const
}

// 등록 직후 updatedAt이 createdAt과 조금 달라도 고친 걸로 보지 않음
const EDITED_GAP_MS = 1000

// 서버 혈당 공통 칸 → 화면 기록. 오늘 · 기록 통합 조회도 같이 씀
export function fromServerReading(item: {
  readingId: number
  value: number
  measuredAt: string
  readingType: ReadingType
  slot: ServerSlot | null
  mealId: number | null
}): GlucoseRecord {
  return {
    id: String(item.readingId),
    slot:
      item.readingType === 'FASTING'
        ? 'fasting'
        : item.readingType === 'POST_MEAL'
          ? 'post-meal'
          : 'bedtime',
    value: item.value,
    measuredAt: item.measuredAt,
    mealType: item.slot ? MEAL_FROM_SLOT[item.slot] : undefined,
    mealId: item.mealId !== null ? String(item.mealId) : undefined,
  }
}

// 서버 기록 → 화면 기록. 끼니 연결(mealId)은 서버 식사 id
export function toGlucoseRecord(item: ReadingResponse): GlucoseRecord {
  const edited =
    new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime() > EDITED_GAP_MS
  return {
    ...fromServerReading(item),
    // 리포트 '나중 입력'은 기존처럼 측정·입력 시각 차이로 판단
    enteredAt: item.createdAt,
    editedAt: edited ? item.updatedAt : undefined,
    criteriaId: item.criteriaVersionId,
  }
}

// 혈당 등록. 잰 날짜의 병원 기준은 서버가 붙임. 식사를 붙이면 서버가 그 식사 측정 알림을 끝냄
export async function createReading(
  target: MeasureTarget,
  value: number,
  measuredAt: Date,
  mealId?: string,
) {
  const { data } = await apiClient.post<BaseResponse<ReadingResponse>>('/readings', {
    value,
    measuredAt: measuredAt.toISOString(),
    ...toServerType(target),
    mealId: mealId ? Number(mealId) : undefined,
  })
  if (!data.data) throw new Error('혈당 등록 응답이 비어 있음')
  return toGlucoseRecord(data.data)
}

// 백엔드 ReadingPageResponse
type ReadingPageResponse = {
  items: ReadingResponse[]
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
async function getReadingPage(cursor: Cursor | null) {
  const { data } = await apiClient.get<BaseResponse<ReadingPageResponse>>('/readings', {
    params: { from: ALL_FROM, to: toDateKey(new Date()), size: PAGE_SIZE, ...cursor },
  })
  return data.data
}

// 내 혈당 기록 전부. 서버는 최신순 → 화면은 오래된 순(마지막이 최근 기록)
export async function getAllReadings() {
  const records: GlucoseRecord[] = []
  let cursor: Cursor | null = null
  do {
    const page = await getReadingPage(cursor)
    if (!page) break
    records.push(...page.items.map(toGlucoseRecord))
    cursor =
      page.hasNext && page.nextCursorAt && page.nextCursorId !== null
        ? { cursorAt: page.nextCursorAt, cursorId: page.nextCursorId }
        : null
  } while (cursor)
  return records.reverse()
}

// 수치·잰 시각 수정. 잰 시각을 바꾸면 서버가 그 날짜 기준을 다시 붙임
export async function updateReading(id: string, changes: { value: number; measuredAt: string }) {
  await apiClient.patch(`/readings/${id}`, changes)
}

// 삭제. 서버는 soft delete라 이후 목록에서 빠짐
export async function deleteReading(id: string) {
  await apiClient.delete(`/readings/${id}`)
}

// 백엔드 ReadingStatsResponse. 숫자만 주고 해석 문구는 없음
type StatsSummary = {
  average: number | null
  // 0~1. 비교할 목표가 없으면 null
  inTargetRate: number | null
  count: number
  missed: number
  overDays: number
}

type StatsPoint = { date: string; average: number | null; count: number }

type ReadingStatsResponse = {
  slot: 'FASTING' | 'POST_MEAL'
  range: { from: string; to: string }
  compareRange: { from: string; to: string }
  targetValue: number | null
  current: StatsSummary
  // 비교 기간에 기록도 놓친 측정도 없으면 null
  previous: StatsSummary | null
  series: StatsPoint[]
  previousSeries: StatsPoint[] | null
  // 식후만 끼니별. 간식(SNACK)은 화면에 없음
  byMeal: {
    meal: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
    average: number | null
    previousAverage: number | null
  }[]
}

const STATS_MEAL: Record<string, MealType | undefined> = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
}

function toPeriodStats(
  summary: StatsSummary,
  series: StatsPoint[],
  byMeal: Partial<Record<MealType, number | null>>,
): PeriodStats {
  const days = series.map((point) => ({
    date: parseDateKey(point.date) ?? new Date(point.date),
    value: point.average,
    count: point.count,
  }))
  const measuredDays = days.filter((day) => day.count > 0).length
  return {
    days,
    average: summary.average,
    count: summary.count,
    inRangeRate: summary.inTargetRate === null ? null : Math.round(summary.inTargetRate * 100),
    // 서버는 넘은 날만 줘서 잰 날에서 뺌
    inRangeDays: measuredDays - summary.overDays,
    measuredDays,
    missed: summary.missed,
    overDays: summary.overDays,
    byMeal: { breakfast: null, lunch: null, dinner: null, ...byMeal },
  }
}

// 혈당 통계. 기간은 화면이 정한 날짜로 보내고(CUSTOM), 비교 기간은 서버가 바로 앞 같은 길이로 잡음
export async function getReadingStats(slot: StatsSlot, range: DateRange) {
  const { data } = await apiClient.get<BaseResponse<ReadingStatsResponse>>('/readings/stats', {
    params: {
      slot: slot === 'fasting' ? 'FASTING' : 'POST_MEAL',
      period: 'CUSTOM',
      from: toDateKey(range.from),
      to: toDateKey(range.to),
    },
  })
  const stats = data.data
  if (!stats) throw new Error('혈당 통계 응답이 비어 있음')
  const meals = stats.byMeal.flatMap((item) => {
    const type = STATS_MEAL[item.meal]
    return type ? [{ type, ...item }] : []
  })
  return {
    current: toPeriodStats(
      stats.current,
      stats.series,
      Object.fromEntries(meals.map((item) => [item.type, item.average])),
    ),
    previous: stats.previous
      ? toPeriodStats(
          stats.previous,
          stats.previousSeries ?? [],
          Object.fromEntries(meals.map((item) => [item.type, item.previousAverage])),
        )
      : null,
  }
}
