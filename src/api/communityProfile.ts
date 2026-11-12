import { apiClient, type BaseResponse } from '@/api/axios'

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
