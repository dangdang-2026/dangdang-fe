import { apiClient, type BaseResponse } from '@/api/axios'
import type { HospitalInfo } from '@/types/hospital'

// 백엔드 HospitalSearchResponse. 심평원에 등록된 병원
type HospitalSearchResponse = {
  items: {
    hiraCode: string
    name: string
    // 상급종합·종합병원·병원·의원 등
    category: string | null
    address: string | null
    phone: string | null
  }[]
  page: number
  size: number
  totalCount: number
  hasNext: boolean
}

// 검색어 길이(서버 2~50자)
export const SEARCH_KEYWORD_MIN = 2
export const SEARCH_KEYWORD_MAX = 50
// 한 번에 받을 수 있는 최대 개수(서버 상한 50)
const SEARCH_SIZE = 50

// 심평원 병원 검색. 고른 병원은 hiraCode까지 병원 추가에 그대로 넘김
export async function searchHospitals(keyword: string) {
  const { data } = await apiClient.get<BaseResponse<HospitalSearchResponse>>('/care-sites/search', {
    params: { keyword, page: 0, size: SEARCH_SIZE },
  })
  if (!data.data) throw new Error('병원 검색 응답이 비어 있음')
  return data.data.items.map((item): HospitalInfo => ({
    hiraCode: item.hiraCode,
    name: item.name,
    kind: item.category ?? undefined,
    address: item.address ?? undefined,
    phone: item.phone ?? undefined,
  }))
}
