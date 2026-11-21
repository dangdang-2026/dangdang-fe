import { apiClient, type BaseResponse } from '@/api/axios'
import type { Criteria, MeasureSlotKey } from '@/types/criteria'
import type { NoteExtraction, NoteFinding } from '@/types/visit'
import { formatDuration, formatMeasureSlots, MEASURE_SLOT_ORDER } from '@/utils/criteria'
import { isSameDay, startOfDay } from '@/utils/date'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
// 메모엔 날짜만 있어서 새 진료 시각은 오전 9시로 두고 진료 탭에서 고침
const DEFAULT_VISIT_HOUR = 9
const UNCHANGED = '바뀌지 않은 것 같아요'
const UNCLEAR = '메모만으로는 분명하지 않아요'
const PAST_DATE = '지난 날짜예요'
const OUT_OF_RANGE = '앱에서 고를 수 없는 시간이에요'
const UNKNOWN_SLOT = '알 수 없는 잴 때가 섞여 있어요'
// AI 정리는 오래 걸릴 수 있어 기본(10초)보다 길게
const ORGANIZE_TIMEOUT_MS = 30000
// 식후 측정 시간은 30분~3시간, 10분 단위만(식후 측정 시간 시트와 같음)
const POST_MEAL_MIN = 30
const POST_MEAL_MAX = 180
const POST_MEAL_STEP = 10

// 백엔드 MeasureSlot → 화면 잴 때
const SLOT_FROM_SERVER: Record<string, MeasureSlotKey> = {
  FASTING: 'fasting',
  BREAKFAST_AFTER: 'breakfast',
  LUNCH_AFTER: 'lunch',
  DINNER_AFTER: 'dinner',
  BEDTIME: 'bedtime',
}

// 백엔드 VisitNoteExtract.Field. FOUND는 체크된 채로, CHECK_NEEDED는 확인 필요로
type ServerField<T> = {
  value: T | null
  // 메모에 있는 근거 문장 그대로
  evidence: string | null
  status: 'FOUND' | 'CHECK_NEEDED' | null
} | null

// 백엔드 VisitNoteExtract. 메모에 없는 칸은 null
type ServerExtract = {
  measureSlots: ServerField<string[]>
  fastingTarget: ServerField<number>
  postMealTarget: ServerField<number>
  postMealMinutes: ServerField<number>
  // yyyy-MM-dd
  nextVisitDate: ServerField<string>
  // 인슐린 · 약 문장을 AI 서버가 걸러 냄
  insulinSkipped: boolean
  promptVersion: string | null
}

// 백엔드 VisitNoteOrganizeResponse
type OrganizeResponse = { noteId: number; aiExtract: ServerExtract }

// 화면에 보일 값. unchanged면 지금과 같음, problem이면 체크 안 한 채로 그 이유를 보여 줌
type Converted = { value: number | string; text: string; unchanged?: boolean; problem?: string }

// 서버 칸 하나 → 결과 화면 한 줄. 값을 못 읽으면 그 칸만 뺌
function toFinding<T>(
  key: NoteFinding['key'],
  field: ServerField<T>,
  convert: (value: T) => Converted | null,
): NoteFinding | null {
  if (!field || field.value === null) return null
  const converted = convert(field.value)
  if (!converted) return null
  const { value, text, unchanged, problem } = converted
  const needsCheck = problem ?? (field.status !== 'FOUND' ? UNCLEAR : unchanged ? UNCHANGED : null)
  return { key, value, text, quote: field.evidence ?? '', needsCheck }
}

// 'yyyy-MM-dd' → 그날 0시. 형식이 다르면 null
function parseDate(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) return null
  const [, year, month, day] = match.map(Number)
  const parsed = new Date(year, month - 1, day)
  return parsed.getMonth() === month - 1 ? parsed : null
}

// 다음 진료일. 지금 진료일과 같은 날이면 정해 둔 시각을 지키고, 지난 날짜면 확인 필요
function toNextVisit(date: string, nextVisitAt: string | null, now: Date): Converted | null {
  const day = parseDate(date)
  if (!day) return null
  const current = nextVisitAt ? new Date(nextVisitAt) : null
  const sameDay = !!current && isSameDay(current, day)
  const at = sameDay ? current : new Date(day.setHours(DEFAULT_VISIT_HOUR))
  return {
    // 같은 날이면 서버에 저장된 값 그대로. 다시 만들면 글자가 달라져 새 진료로 잘못 볼 수 있음
    value: sameDay && nextVisitAt ? nextVisitAt : at.toISOString(),
    text: `${at.getMonth() + 1}월 ${at.getDate()}일 (${WEEKDAYS[at.getDay()]})`,
    unchanged: sameDay,
    problem: startOfDay(at) < startOfDay(now) ? PAST_DATE : undefined,
  }
}

// 잴 때. 모르는 값은 빼고 하루 순서로, 쉼표로 이어 값으로 넘김
function toSlots(values: string[], current: MeasureSlotKey[]): Converted | null {
  const slots = MEASURE_SLOT_ORDER.filter((key) =>
    values.some((value) => SLOT_FROM_SERVER[value] === key),
  )
  if (slots.length === 0) return null
  const same = slots.length === current.length && slots.every((key) => current.includes(key))
  const unknown = values.some((value) => !SLOT_FROM_SERVER[value])
  return {
    value: slots.join(','),
    text: formatMeasureSlots(slots),
    unchanged: same,
    problem: unknown ? UNKNOWN_SLOT : undefined,
  }
}

// 저장된 진료 메모를 서버 AI로 정리. 잴 때 · 측정 시점 · 목표 · 다음 진료일만, 약은 정리하지 않음
export async function organizeVisitNote(
  visitId: string,
  noteId: string,
  current: Pick<Criteria, 'postMealHours' | 'measureSlots' | 'targets'>,
  nextVisitAt: string | null,
  now = new Date(),
): Promise<NoteExtraction> {
  const { data } = await apiClient.post<BaseResponse<OrganizeResponse>>(
    `/visits/${visitId}/notes/${noteId}/organize`,
    undefined,
    { timeout: ORGANIZE_TIMEOUT_MS },
  )
  const extract = data.data?.aiExtract
  if (!extract) throw new Error('진료 메모 정리 응답이 비어 있음')

  const findings = [
    toFinding('measureSlots', extract.measureSlots, (values) =>
      toSlots(values, current.measureSlots),
    ),
    toFinding('postMealHours', extract.postMealMinutes, (minutes) => ({
      value: minutes / 60,
      text: `식후 ${formatDuration(minutes / 60)}`,
      // 저장된 값이 소수로 반올림돼 있을 수 있어 분 단위로 비교
      unchanged:
        current.postMealHours !== null && minutes === Math.round(current.postMealHours * 60),
      problem:
        minutes < POST_MEAL_MIN || minutes > POST_MEAL_MAX || minutes % POST_MEAL_STEP !== 0
          ? OUT_OF_RANGE
          : undefined,
    })),
    toFinding('postMeal', extract.postMealTarget, (target) => ({
      value: target,
      text: `${target} 미만`,
      unchanged: target === current.targets.postMeal,
    })),
    toFinding('fasting', extract.fastingTarget, (target) => ({
      value: target,
      text: `${target} 미만`,
      unchanged: target === current.targets.fasting,
    })),
    toFinding('nextVisit', extract.nextVisitDate, (date) => toNextVisit(date, nextVisitAt, now)),
  ].filter((item): item is NoteFinding => item !== null)

  // 바로 바꿀 수 있는 것 먼저, 확인 필요는 아래로
  findings.sort((a, b) => Number(!!a.needsCheck) - Number(!!b.needsCheck))
  return { findings, insulinSkipped: extract.insulinSkipped }
}
