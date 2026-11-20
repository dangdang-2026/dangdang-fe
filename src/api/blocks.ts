import { apiClient, type BaseResponse } from '@/api/axios'

type BlockListResponse = {
  items: { profileId: string; nickname: string; blockedAt: string }[]
  nextCursor: string | null
  hasNext: boolean
}

// 한 번에 받을 최대 개수(서버 상한 100)
const PAGE_SIZE = 100

// 차단 목록 전부. 최근 차단 순
export async function getBlockedProfiles() {
  const items: { id: string; nickname: string }[] = []
  let cursor: string | undefined
  do {
    const { data } = await apiClient.get<BaseResponse<BlockListResponse>>('/blocks', {
      params: { cursor, size: PAGE_SIZE },
    })
    if (!data.data) break
    items.push(...data.data.items.map((item) => ({ id: item.profileId, nickname: item.nickname })))
    cursor = data.data.hasNext ? (data.data.nextCursor ?? undefined) : undefined
  } while (cursor)
  return items
}

// 프로필 차단. 다시 해도 200, 자기 자신 COMMUNITY_40003, 없는 프로필 COMMUNITY_40402
export async function blockProfile(profileId: string) {
  await apiClient.post('/blocks', { blockedProfileId: Number(profileId) })
}

// 차단 해제. 차단한 적 없어도 200
export async function unblockProfile(profileId: string) {
  await apiClient.delete(`/blocks/${profileId}`)
}
