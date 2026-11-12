import { apiClient, type BaseResponse } from '@/api/axios'
import type { Department, Hospital, HospitalInfo } from '@/types/hospital'

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

// 백엔드 Department
type ServerDepartment = 'OBGYN' | 'ENDO' | 'NUTRITION' | 'ETC'

export const DEPARTMENT: Record<Department, ServerDepartment> = {
  산부인과: 'OBGYN',
  내분비내과: 'ENDO',
  '영양 상담': 'NUTRITION',
  기타: 'ETC',
}

const DEPARTMENT_FROM: Record<ServerDepartment, Department> = {
  OBGYN: '산부인과',
  ENDO: '내분비내과',
  NUTRITION: '영양 상담',
  ETC: '기타',
}

// 백엔드 CareSiteResponse
export type CareSiteResponse = {
  careSiteId: number
  name: string
  department: ServerDepartment
  hiraCode: string | null
  address: string | null
  phone: string | null
  roleNote: string | null
  primary: boolean
  sortOrder: number
}

// 서버 병원 → 앱 병원. 병원 종류·다음 진료일은 서버에 없어 비워 둠
export function toHospital(item: CareSiteResponse): Hospital {
  return {
    id: String(item.careSiteId),
    hiraCode: item.hiraCode ?? undefined,
    name: item.name,
    address: item.address ?? undefined,
    phone: item.phone ?? undefined,
    department: DEPARTMENT_FROM[item.department],
    nextVisitAt: null,
  }
}

// 내 병원 전부. 서버가 대표 병원 먼저, 정한 순서대로 줌
export async function getCareSites() {
  const { data } = await apiClient.get<BaseResponse<CareSiteResponse[]>>('/care-sites')
  return (data.data ?? []).map(toHospital)
}
