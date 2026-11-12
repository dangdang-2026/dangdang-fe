import { apiClient, getErrorCode, type BaseResponse } from '@/api/axios'

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
}

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
