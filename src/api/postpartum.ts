import { apiClient, type BaseResponse } from '@/api/axios'
import type { PostpartumCheck } from '@/stores/useProfileStore'

// 백엔드 PostpartumTestResponse
export type PostpartumTestResponse = {
  id: number
  name: string
  testDate: string
  remindDayBefore: boolean
  remindSameDay: boolean
  resultNote: string | null
}

// 서버 산후 검사 → 화면 검사. 전날 저녁 · 당일 아침 알림
export function toPostpartumCheck(test: PostpartumTestResponse): PostpartumCheck {
  return {
    id: String(test.id),
    name: test.name,
    date: test.testDate,
    remind: [
      ...(test.remindDayBefore ? ['eve' as const] : []),
      ...(test.remindSameDay ? ['morning' as const] : []),
    ],
    memo: test.resultNote,
  }
}

// 백엔드 PostpartumHomeResponse. dayAfterDelivery · askToday는 화면이 출산일 · askOn으로 직접 계산해서 안 씀
type PostpartumHomeResponse = {
  deliveryDate: string
  dayAfterDelivery: number
  askOn: string | null
  askToday: boolean
  upcomingTests: PostpartumTestResponse[]
}

// 산후 홈. 산후가 아니면 409
export async function getPostpartumHome() {
  const { data } = await apiClient.get<BaseResponse<PostpartumHomeResponse>>('/postpartum')
  if (!data.data) throw new Error('산후 홈 응답이 비어 있음')
  return data.data
}

// 백엔드 remind-later 응답
type RemindLaterResponse = { topic: 'POSTPARTUM_TEST_DATE'; remindOn: string }

// 산후 검사 날짜를 이날(YYYY-MM-DD, 오늘이나 그 뒤) 다시 물어봄
export async function remindLater(remindOn: string) {
  const { data } = await apiClient.post<BaseResponse<RemindLaterResponse>>('/me/remind-later', {
    remindOn,
  })
  if (!data.data) throw new Error('다시 물어볼 날 응답이 비어 있음')
  return data.data.remindOn
}

// 산후 검사 목록. 날짜 순, 지난 검사 포함
export async function getPostpartumTests() {
  const { data } = await apiClient.get<BaseResponse<PostpartumTestResponse[]>>('/postpartum/tests')
  return (data.data ?? []).map(toPostpartumCheck)
}

// 화면 검사 → 서버 요청 칸
const toTestRequest = (check: Pick<PostpartumCheck, 'name' | 'date' | 'remind'>) => ({
  name: check.name,
  testDate: check.date,
  remindDayBefore: check.remind.includes('eve'),
  remindSameDay: check.remind.includes('morning'),
})

// 산후 검사 등록. 산후가 아니면 409
export async function createPostpartumTest(
  check: Pick<PostpartumCheck, 'name' | 'date' | 'remind'>,
) {
  const { data } = await apiClient.post<BaseResponse<PostpartumTestResponse>>(
    '/postpartum/tests',
    toTestRequest(check),
  )
  if (!data.data) throw new Error('산후 검사 등록 응답이 비어 있음')
  return toPostpartumCheck(data.data)
}

// 산후 검사 수정. 날짜를 바꾸면 서버가 알림을 다시 예약함
export async function updatePostpartumTest(
  id: string,
  check: Pick<PostpartumCheck, 'name' | 'date' | 'remind'>,
) {
  const { data } = await apiClient.patch<BaseResponse<PostpartumTestResponse>>(
    `/postpartum/tests/${id}`,
    toTestRequest(check),
  )
  if (!data.data) throw new Error('산후 검사 수정 응답이 비어 있음')
  return toPostpartumCheck(data.data)
}

// 산후 검사 결과 메모. 들은 그대로, 비우면 지움
export async function updatePostpartumTestResult(id: string, resultNote: string) {
  const { data } = await apiClient.patch<BaseResponse<PostpartumTestResponse>>(
    `/postpartum/tests/${id}/result`,
    { resultNote },
  )
  if (!data.data) throw new Error('산후 검사 결과 응답이 비어 있음')
  return toPostpartumCheck(data.data)
}

// 산후 검사 일정 지우기. 남의 것 · 없는 번호면 404
export async function deletePostpartumTest(id: string) {
  await apiClient.delete(`/postpartum/tests/${id}`)
}
