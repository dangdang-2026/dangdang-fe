import { apiClient, getErrorCode, type BaseResponse } from '@/api/axios'

// 백엔드 NicknameSuggestionResponse
type NicknameSuggestionResponse = { nickname: string }

// 지금 아무도 안 쓰는 이름 추천. 저장은 안 됨. 못 찾으면 COMMUNITY_40903
export async function getNicknameSuggestion() {
  const { data } = await apiClient.get<BaseResponse<NicknameSuggestionResponse>>(
    '/community/profiles/nickname-suggestion',
  )
  if (!data.data) throw new Error('닉네임 추천 응답이 비어 있음')
  return data.data.nickname
}

// 백엔드 NicknameAvailabilityResponse
type NicknameAvailabilityResponse = { available: boolean }

// 아무도 안 쓰는 닉네임인지. 형식이 틀리면 COMMUNITY_40001
export async function checkNicknameAvailable(nickname: string) {
  const { data } = await apiClient.get<BaseResponse<NicknameAvailabilityResponse>>(
    '/community/profiles/nickname-availability',
    { params: { nickname } },
  )
  return data.data?.available ?? true
}

// 백엔드 CommunityProfileResponse
type CommunityProfileResponse = { id: string; nickname: string; showWeekBadge: boolean }

// 앱 커뮤니티 프로필. showWeek: 글 옆 임신 주수 배지
export type CommunityProfile = { nickname: string; showWeek: boolean }

const toProfile = (data: CommunityProfileResponse): CommunityProfile => ({
  nickname: data.nickname,
  showWeek: data.showWeekBadge,
})

// 커뮤니티 프로필 만들기. 이름 중복 COMMUNITY_40901, 이미 있으면 COMMUNITY_40902
export async function createCommunityProfile(nickname: string, showWeek: boolean) {
  const { data } = await apiClient.post<BaseResponse<CommunityProfileResponse>>(
    '/community/profiles',
    { nickname, showWeekBadge: showWeek },
  )
  if (!data.data) throw new Error('커뮤니티 프로필 응답이 비어 있음')
  return toProfile(data.data)
}

// 내 커뮤니티 프로필. 아직 안 만들었으면(COMMUNITY_40401) null
export async function getMyCommunityProfile() {
  try {
    const { data } =
      await apiClient.get<BaseResponse<CommunityProfileResponse>>('/community/profiles/me')
    return data.data ? toProfile(data.data) : null
  } catch (error) {
    if (getErrorCode(error) === 'COMMUNITY_40401') return null
    throw error
  }
}

// 커뮤니티 프로필 수정. 바꾼 칸만 보냄. 이름 중복 COMMUNITY_40901
export async function updateCommunityProfile(changes: Partial<CommunityProfile>) {
  const { data } = await apiClient.patch<BaseResponse<CommunityProfileResponse>>(
    '/community/profiles/me',
    { nickname: changes.nickname, showWeekBadge: changes.showWeek },
  )
  if (!data.data) throw new Error('커뮤니티 프로필 응답이 비어 있음')
  return toProfile(data.data)
}
