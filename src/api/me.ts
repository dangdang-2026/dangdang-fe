import { apiClient, type BaseResponse } from '@/api/axios'

// 백엔드 MeResponse
export type Me = {
  userId: number
  // 카카오는 없을 수 있음
  email: string | null
  displayName: string
  authProvider: 'EMAIL' | 'KAKAO'
  // 필수 약관 4개에 동의했는지
  consentCompleted: boolean
}

// 로그인 쿠키로 내 정보 조회. 쿠키 없거나 만료면 401
export async function getMe() {
  const { data } = await apiClient.get<BaseResponse<Me>>('/me')
  if (!data.data) throw new Error('내 정보 응답이 비어 있음')
  return data.data
}
