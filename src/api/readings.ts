import { apiClient, type BaseResponse } from '@/api/axios'
import type { GlucoseRecord, MealType, MeasureTarget } from '@/types/glucose'
import { toDateKey } from '@/utils/date'

// 백엔드 ReadingType · MeasureSlot
type ReadingType = 'FASTING' | 'POST_MEAL' | 'OTHER'
type ServerSlot = 'FASTING' | 'BREAKFAST_AFTER' | 'LUNCH_AFTER' | 'DINNER_AFTER' | 'BEDTIME'

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

// 서버 기록 → 화면 기록. 끼니 연결(mealId)은 끼니 API 전까지 기기에서만 붙임
export function toGlucoseRecord(item: ReadingResponse): GlucoseRecord {
  const edited =
    new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime() > EDITED_GAP_MS
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
    // 리포트 '나중 입력'은 기존처럼 측정·입력 시각 차이로 판단
    enteredAt: item.createdAt,
    mealType: item.slot ? MEAL_FROM_SLOT[item.slot] : undefined,
    editedAt: edited ? item.updatedAt : undefined,
    criteriaId: item.criteriaVersionId,
  }
}

// 혈당 등록. 잰 날짜의 병원 기준은 서버가 붙임
export async function createReading(target: MeasureTarget, value: number, measuredAt: Date) {
  const { data } = await apiClient.post<BaseResponse<ReadingResponse>>('/readings', {
    value,
    measuredAt: measuredAt.toISOString(),
    ...toServerType(target),
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
