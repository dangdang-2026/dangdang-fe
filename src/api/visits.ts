import { apiClient, type BaseResponse } from '@/api/axios'

// 백엔드 VisitResponse. 날짜 미정이면 visitAt null
export type VisitResponse = {
  visitId: number
  careSiteId: number | null
  visitAt: string | null
  createdAt: string
  updatedAt: string
}

// 백엔드 VisitPageResponse. 진료 날짜 이른 순, 날짜 미정은 맨 뒤
type VisitPageResponse = {
  items: VisitResponse[]
  page: number
  size: number
  hasNext: boolean
}

// 한 번에 받을 최대 개수(서버 상한 100)
const PAGE_SIZE = 100

// 진료 일정 등록. 병원 · 날짜 모두 선택, 지난 날짜도 됨
export async function createVisit(careSiteId: number | null, visitAt: string | null) {
  const { data } = await apiClient.post<BaseResponse<VisitResponse>>('/visits', {
    careSiteId: careSiteId ?? undefined,
    visitAt: visitAt ?? undefined,
  })
  if (!data.data) throw new Error('진료 일정 등록 응답이 비어 있음')
  return data.data
}

// 내 진료 일정 전부
export async function getAllVisits() {
  const visits: VisitResponse[] = []
  let page = 0
  let hasNext = true
  while (hasNext) {
    const { data } = await apiClient.get<BaseResponse<VisitPageResponse>>('/visits', {
      params: { page, size: PAGE_SIZE },
    })
    if (!data.data) break
    visits.push(...data.data.items)
    hasNext = data.data.hasNext
    page += 1
  }
  return visits
}

// 진료 날짜 바꾸기. null이면 날짜 미정
export async function updateVisitAt(visitId: string, visitAt: string | null) {
  const { data } = await apiClient.patch<BaseResponse<VisitResponse>>(`/visits/${visitId}`, {
    visitAt,
  })
  if (!data.data) throw new Error('진료 일정 수정 응답이 비어 있음')
  return data.data
}

// 백엔드 VisitQuestionResponse. sortOrder 작은 순 → 먼저 만든 순
export type VisitQuestionResponse = {
  questionId: number
  content: string
  source: 'USER' | 'CHATBOT' | 'CARD'
  sortOrder: number
  createdAt: string
  // 카드뉴스에서 담았으면 그 카드 번호
  sourceCardId?: number | null
  // 출처 카드가 내려갔으면 true
  sourceCardWithdrawn?: boolean
}

// 진료 질문 목록
export async function getVisitQuestions(visitId: string) {
  const { data } = await apiClient.get<BaseResponse<VisitQuestionResponse[]>>(
    `/visits/${visitId}/questions`,
  )
  return data.data ?? []
}

// 진료 질문 등록(500자). sortOrder를 안 보내면 맨 뒤
// chatMessageId: 당당이 「물어볼 말 정리」 답 번호(source CHATBOT), cardId: 카드뉴스에서 담은 카드 번호(source CARD). 둘 중 하나만
export type QuestionSource = { chatMessageId?: string; cardId?: string }

export async function createVisitQuestion(
  visitId: string,
  content: string,
  sortOrder?: number,
  source: QuestionSource = {},
) {
  const { data } = await apiClient.post<BaseResponse<VisitQuestionResponse>>(
    `/visits/${visitId}/questions`,
    {
      content,
      sortOrder,
      chatMessageId: source.chatMessageId ? Number(source.chatMessageId) : undefined,
      cardId: source.cardId ? Number(source.cardId) : undefined,
    },
  )
  if (!data.data) throw new Error('진료 질문 등록 응답이 비어 있음')
  return data.data
}

// 진료 질문 삭제. 이미 지운 질문이어도 200
export async function deleteVisitQuestion(visitId: string, questionId: string) {
  await apiClient.delete(`/visits/${visitId}/questions/${questionId}`)
}

// 백엔드 VisitNoteResponse
export type VisitNoteResponse = {
  noteId: number
  content: string
  createdAt: string
  updatedAt: string
}

// 진료 메모 목록. 먼저 쓴 순
export async function getVisitNotes(visitId: string) {
  const { data } = await apiClient.get<BaseResponse<VisitNoteResponse[]>>(
    `/visits/${visitId}/notes`,
  )
  return data.data ?? []
}

// 진료 메모 등록(5000자). 적은 그대로 저장, AI 정리는 안 돌림
export async function createVisitNote(visitId: string, content: string) {
  const { data } = await apiClient.post<BaseResponse<VisitNoteResponse>>(
    `/visits/${visitId}/notes`,
    { content },
  )
  if (!data.data) throw new Error('진료 메모 등록 응답이 비어 있음')
  return data.data
}

// 진료 메모 통째로 고치기
export async function updateVisitNote(visitId: string, noteId: string, content: string) {
  const { data } = await apiClient.patch<BaseResponse<VisitNoteResponse>>(
    `/visits/${visitId}/notes/${noteId}`,
    { content },
  )
  if (!data.data) throw new Error('진료 메모 수정 응답이 비어 있음')
  return data.data
}
