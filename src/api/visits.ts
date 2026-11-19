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
