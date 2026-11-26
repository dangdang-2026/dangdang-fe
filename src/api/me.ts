import { apiClient, getErrorCode, type BaseResponse } from '@/api/axios'
import type { PregnancyState } from '@/api/pregnancy'
import type { CareMode } from '@/stores/useProfileStore'

// 백엔드 CareMode. 대문자만 받음
type ServerCareMode = 'DIET' | 'INSULIN' | 'ORAL'

// 백엔드 PregnancyCareProfileResponse. 임신 정보가 없으면 DIET · null
type CareProfileResponse = {
  diagnosisDate: string | null
  careMode: ServerCareMode
  contactMemo: string | null
  contactMemoUpdatedAt: string | null
}

// 백엔드 MeResponse
export type Me = {
  userId: number
  // 카카오는 없을 수 있음
  email: string | null
  displayName: string
  authProvider: 'EMAIL' | 'KAKAO'
  // 필수 약관 4개에 동의했는지
  consentCompleted: boolean
  // 이름 바꿀 때 그대로 보낼 수정 버전(BIGINT 문자열)
  version: string
  // 임신 정보가 없으면 null
  pregnancyState: PregnancyState | null
  // 로그인 방식별 연결 여부. 운영 서버 배포 전엔 없을 수 있음
  loginMethods?: { email: boolean; kakao: boolean }
  // 출산예정일(YYYY-MM-DD). 안 적었거나 다른 상황(PAUSED)이면 null
  dueDate?: string | null
} & Partial<CareProfileResponse>

// 백엔드 NameUpdateResponse
type NameUpdateResponse = { name: string; version: string }

// 이름 바꿀 때 보낼 수정 버전. /me를 받을 때마다 최신으로
let meVersion: string | null = null

// 로그인 쿠키로 내 정보 조회. 쿠키 없거나 만료면 401
export async function getMe() {
  const { data } = await apiClient.get<BaseResponse<Me>>('/me')
  if (!data.data) throw new Error('내 정보 응답이 비어 있음')
  meVersion = data.data.version
  return data.data
}

// 이름 바꾸기 결과. 다른 기기에서 먼저 바꿨으면 서버의 최신 이름
export type NameUpdateResult =
  { status: 'saved'; name: string } | { status: 'conflict'; name: string }

// 내 이름 바꾸기. 서버가 앞뒤 공백을 지운 1~10자만 받음
export async function updateName(name: string): Promise<NameUpdateResult> {
  const version = meVersion ?? (await getMe()).version
  try {
    const { data } = await apiClient.patch<BaseResponse<NameUpdateResponse>>('/me', {
      name,
      version,
    })
    if (!data.data) throw new Error('이름 변경 응답이 비어 있음')
    meVersion = data.data.version
    return { status: 'saved', name: data.data.name }
  } catch (error) {
    // 다른 기기에서 먼저 바꿔 버전이 다르면 최신 이름을 다시 받음
    if (getErrorCode(error) !== 'USER_40901') throw error
    const me = await getMe()
    return { status: 'conflict', name: me.displayName }
  }
}

// 진단일 · 관리 모드 · 연락 기준 메모
export type CareProfile = { diagnosisDate: string | null; careMode: CareMode; contactMemo: string }

export const toCareProfile = (data: CareProfileResponse): CareProfile => ({
  diagnosisDate: data.diagnosisDate,
  careMode: data.careMode.toLowerCase() as CareMode,
  contactMemo: data.contactMemo ?? '',
})

async function patchCareProfile(path: string, body: object) {
  const { data } = await apiClient.patch<BaseResponse<CareProfileResponse>>(path, body)
  if (!data.data) throw new Error('관리 정보 응답이 비어 있음')
  return toCareProfile(data.data)
}

// 진단일(YYYY-MM-DD). 오늘 뒤 PREGNANCY_40003, 예정일 뒤 40004, 출산일 뒤 40005
export const updateDiagnosisDate = (diagnosisDate: string) =>
  patchCareProfile('/me/diagnosis-date', { diagnosisDate })

export const updateCareMode = (careMode: CareMode) =>
  patchCareProfile('/me/care-mode', { careMode: careMode.toUpperCase() })

// 한 줄 100자까지. 비우면 지움. 서버가 줄바꿈 · 탭을 거절해 띄어쓰기로(예전에 여러 줄로 적은 메모도)
export const updateContactMemo = (contactMemo: string) =>
  patchCareProfile('/me/contact-memo', {
    contactMemo: contactMemo.replace(/[\p{Cc}\u2028\u2029]+/gu, ' '),
  })

// 백엔드 DueDateResponse
type DueDateResponse = { dueDate: string }

// 출산 예정일 저장·변경(YYYY-MM-DD). 진행 중인 임신이 없으면 서버가 새로 만듦
export async function saveDueDate(dueDate: string) {
  const { data } = await apiClient.patch<BaseResponse<DueDateResponse>>('/me/due-date', {
    dueDate,
  })
  if (!data.data) throw new Error('출산 예정일 응답이 비어 있음')
  return data.data.dueDate
}
