import { apiClient, type BaseResponse } from '@/api/axios'
import type {
  GlucoseRecord,
  MealType,
  MeasureTarget,
  MeterLimit,
  ReadingTiming,
} from '@/types/glucose'
import { parseDateKey, toDateKey } from '@/utils/date'
import type { DateRange, PeriodStats, StatsSlot } from '@/utils/stats'

// 백엔드 ReadingType · MeasureSlot
export type ReadingType = 'FASTING' | 'POST_MEAL' | 'OTHER'
export type ServerSlot = 'FASTING' | 'BREAKFAST_AFTER' | 'LUNCH_AFTER' | 'DINNER_AFTER' | 'BEDTIME'

// 백엔드 ReadingResponse
export type ReadingResponse = {
  readingId: number
  value: number
  measuredAt: string
  readingType: ReadingType
  slot: ServerSlot | null
  criteriaVersionId: number
  mealId: number | null
  createdAt: string
  updatedAt: string
} & ServerJudgment

// 백엔드 혈당 판정 칸(#136). 목록 · 오늘 · 같은 메뉴 · 저장 응답이 같은 규칙
export type ServerJudgment = {
  targetValue?: number | null
  aboveTarget?: boolean | null
  expectedAt?: string | null
  timing?: ReadingTiming | null
  originalValue?: number | null
  originalMeterLimit?: MeterLimit | null
  editedAt?: string | null
  meterLimit?: MeterLimit | null
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
export function fromServerReading(
  item: {
    readingId: number
    value: number
    measuredAt: string
    readingType: ReadingType
    slot: ServerSlot | null
    mealId: number | null
  } & ServerJudgment,
): GlucoseRecord {
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
    // 서버가 판정 칸을 보냈을 때만. 안 보낸 응답이면 화면이 기준으로 계산
    ...(item.aboveTarget !== undefined && {
      targetValue: item.targetValue ?? null,
      aboveTarget: item.aboveTarget,
    }),
    ...(item.timing !== undefined && {
      expectedAt: item.expectedAt ?? null,
      timing: item.timing,
    }),
    ...(item.originalValue !== undefined && { originalValue: item.originalValue }),
    ...(item.originalMeterLimit !== undefined && { originalMeterLimit: item.originalMeterLimit }),
    ...(item.meterLimit !== undefined && { meterLimit: item.meterLimit }),
    ...(item.editedAt !== undefined && { editedAt: item.editedAt ?? undefined }),
  }
}

// 서버 기록 → 화면 기록. 끼니 연결(mealId)은 서버 식사 id
export function toGlucoseRecord(item: ReadingResponse): GlucoseRecord {
  // 서버가 고친 시각(editedAt)을 주면 그걸로, 안 주는 응답이면 저장 · 수정 시각 차이로
  const edited =
    new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime() > EDITED_GAP_MS
  return {
    ...(item.editedAt === undefined && { editedAt: edited ? item.updatedAt : undefined }),
    ...fromServerReading(item),
    // 리포트 '나중 입력'은 기존처럼 측정·입력 시각 차이로 판단
    enteredAt: item.createdAt,
    criteriaId: item.criteriaVersionId,
  }
}

// 혈당 등록. 잰 날짜의 병원 기준은 서버가 붙임. 식사를 붙이면 서버가 그 식사 측정 알림을 끝냄
// value가 HI · LO면 숫자 대신 meterLimit으로(둘 다 보내면 서버가 400)
export async function createReading(
  target: MeasureTarget,
  value: number | MeterLimit,
  measuredAt: Date,
  mealId?: string,
) {
  const { data } = await apiClient.post<BaseResponse<ReadingResponse>>('/readings', {
    ...(typeof value === 'number' ? { value } : { meterLimit: value }),
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
// 혈당 고치기에서 바꿀 칸. 안 보낸 칸은 서버가 그대로 둠
export type ReadingChanges = {
  // 빼면 값은 그대로(HI · LO 기록은 글자 그대로)
  value?: number
  measuredAt: string
  // 시점을 바꿀 때. 공복 · 자기 전으로 바꾸면 서버가 식사 연결을 끊음
  target?: Pick<MeasureTarget, 'slot' | 'mealType'>
  // 식후로 바꾸며 그날 그 끼니 식사에 붙일 때
  mealId?: string
}

// 서버가 새 값으로 다시 판정한 기록을 돌려줌. 같은 기록을 동시에 고치면 409 READING_40903
// 식후 혈당이 식사 시작보다 앞이면 400 READING_40005
export async function updateReading(id: string, changes: ReadingChanges) {
  const { target, mealId, ...rest } = changes
  const { data } = await apiClient.patch<BaseResponse<ReadingResponse>>(`/readings/${id}`, {
    ...rest,
    ...(target && toServerType(target)),
    ...(mealId && { mealId: Number(mealId) }),
  })
  if (!data.data) throw new Error('혈당 수정 응답이 비어 있음')
  return toGlucoseRecord(data.data)
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
  judged: number
  inTarget: number
  judgedDays: number
  inTargetDays: number
  belowLow: number
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
  // 처음 잰 날(공복 · 식후 · 기타 전부). 기록이 없으면 null
  firstRecordDate: string | null
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
  return {
    days,
    average: summary.average,
    count: summary.count,
    inRangeRate: summary.inTargetRate === null ? null : Math.round(summary.inTargetRate * 100),
    // 서버가 목표와 비교한 날만 셈(목표가 없던 날은 빼고)
    inRangeDays: summary.inTargetDays,
    measuredDays: summary.judgedDays,
    missed: summary.missed,
    overDays: summary.overDays,
    judged: summary.judged,
    inTarget: summary.inTarget,
    belowLow: summary.belowLow,
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
    firstRecordDate: parseDateKey(stats.firstRecordDate),
  }
}

// 지운 혈당 5분 안 되돌리기. 지난 시간이면 409 READING_40902, 붙은 식사가 지워졌으면 READING_40904
export async function restoreReading(id: string) {
  const { data } = await apiClient.post<BaseResponse<ReadingResponse>>(`/readings/${id}/restore`)
  if (!data.data) throw new Error('혈당 되돌리기 응답이 비어 있음')
  return toGlucoseRecord(data.data)
}
