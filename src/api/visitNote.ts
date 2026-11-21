import { apiClient, type BaseResponse } from '@/api/axios'
import type { Criteria } from '@/types/criteria'
import type { NoteExtraction, NoteFinding } from '@/types/visit'
import { formatDuration } from '@/utils/criteria'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
// 메모엔 날짜만 있어서 진료 시각은 오전 9시로 두고 진료 탭에서 고침
const DEFAULT_VISIT_HOUR = 9
const UNCHANGED = '바뀌지 않은 것 같아요'
const UNCLEAR = '메모만으로는 분명하지 않아요'

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

// 서버 칸 하나 → 결과 화면 한 줄. 확인 필요거나 지금 값과 같으면 체크 안 한 채로
function toFinding<T>(
  key: NoteFinding['key'],
  field: ServerField<T>,
  toValue: (value: T) => { value: number | string; text: string },
  current?: number | null,
): NoteFinding | null {
  if (!field || field.value === null) return null
  const { value, text } = toValue(field.value)
  const needsCheck =
    field.status !== 'FOUND'
      ? UNCLEAR
      : current !== undefined && value === current
        ? UNCHANGED
        : null
  return { key, value, text, quote: field.evidence ?? '', needsCheck }
}

// 'yyyy-MM-dd' → 그날 오전 9시(기기 시간)
function toVisitAt(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day, DEFAULT_VISIT_HOUR)
}

// 저장된 진료 메모를 서버 AI로 정리. 측정 시점 · 목표 · 다음 진료일만, 약은 정리하지 않음
export async function organizeVisitNote(
  visitId: string,
  noteId: string,
  current: Pick<Criteria, 'postMealHours' | 'targets'>,
): Promise<NoteExtraction> {
  const { data } = await apiClient.post<BaseResponse<OrganizeResponse>>(
    `/visits/${visitId}/notes/${noteId}/organize`,
  )
  const extract = data.data?.aiExtract
  if (!extract) throw new Error('진료 메모 정리 응답이 비어 있음')

  const findings = [
    toFinding(
      'postMealHours',
      extract.postMealMinutes,
      (minutes) => ({ value: minutes / 60, text: `식후 ${formatDuration(minutes / 60)}` }),
      current.postMealHours,
    ),
    toFinding(
      'postMeal',
      extract.postMealTarget,
      (target) => ({ value: target, text: `${target} 미만` }),
      current.targets.postMeal,
    ),
    toFinding(
      'fasting',
      extract.fastingTarget,
      (target) => ({ value: target, text: `${target} 미만` }),
      current.targets.fasting,
    ),
    toFinding('nextVisit', extract.nextVisitDate, (date) => {
      const at = toVisitAt(date)
      return {
        value: at.toISOString(),
        text: `${at.getMonth() + 1}월 ${at.getDate()}일 (${WEEKDAYS[at.getDay()]})`,
      }
    }),
  ].filter((item): item is NoteFinding => item !== null)

  // 바로 바꿀 수 있는 것 먼저, 확인 필요는 아래로
  findings.sort((a, b) => Number(!!a.needsCheck) - Number(!!b.needsCheck))
  return { findings, insulinSkipped: extract.insulinSkipped }
}
