import { apiClient, type BaseResponse } from '@/api/axios'

type BlockListResponse = {
  // 익명으로 막은 줄은 profileId가 null이고 nickname은 「익명 사용자」
  items: {
    blockId: number
    profileId: number | string | null
    nickname: string
    anonymous: boolean
    blockedAt: string
  }[]
  nextCursor: string | null
  hasNext: boolean
}

// 차단 목록 한 줄. id는 프로필 번호, 익명 줄은 프로필을 몰라 'anon-줄번호'
export type BlockedEntry = {
  blockId: string
  id: string
  nickname: string
  anonymous: boolean
  blockedAt: string
}

// 한 번에 받을 최대 개수(서버 상한 100)
const PAGE_SIZE = 100

// 차단 목록 전부. 최근 차단 순
export async function getBlockedProfiles() {
  const items: BlockedEntry[] = []
  let cursor: string | undefined
  do {
    const { data } = await apiClient.get<BaseResponse<BlockListResponse>>('/blocks', {
      params: { cursor, size: PAGE_SIZE },
    })
    if (!data.data) break
    items.push(
      ...data.data.items.map((item) => ({
        blockId: String(item.blockId),
        id: item.profileId !== null ? String(item.profileId) : `anon-${item.blockId}`,
        nickname: item.nickname,
        anonymous: item.anonymous,
        blockedAt: item.blockedAt,
      })),
    )
    cursor = data.data.hasNext ? (data.data.nextCursor ?? undefined) : undefined
  } while (cursor)
  return items
}

// 프로필 차단. 다시 해도 200, 자기 자신 COMMUNITY_40003, 없는 프로필 COMMUNITY_40402
export async function blockProfile(profileId: string) {
  await apiClient.post('/blocks', { blockedProfileId: Number(profileId) })
}

// 이 글을 쓴 사람 차단. 익명 글이어도 됨(그 사람의 익명 글 · 댓글만 가려짐)
export async function blockPostAuthor(postId: string) {
  await apiClient.post('/blocks', { postId: Number(postId) })
}

// 이름으로 막은 차단 풀기. 차단한 적 없어도 200
export async function unblockProfile(profileId: string) {
  await apiClient.delete(`/blocks/${profileId}`)
}

// 차단 한 줄 풀기. 「익명 사용자」 줄은 이걸로만 풂
export async function unblockEntry(blockId: string) {
  await apiClient.delete(`/blocks/entries/${blockId}`)
}
