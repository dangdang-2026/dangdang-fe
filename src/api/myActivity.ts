import { apiClient, type BaseResponse } from '@/api/axios'
import { toPost, type PostListResponse } from '@/api/posts'
import type { Post } from '@/types/community'

// 한 번에 받는 수(서버 기본 20)
const PAGE_SIZE = 20

// 백엔드 MyCommentListResponse.Item
type MyCommentResponse = {
  id: string
  postId: string
  postTitle: string
  parentId: string | null
  content: string
  anonymous: boolean
  reactionCount: number
  createdAt: string
}

// 내가 쓴 댓글 한 줄. 원글 제목과 함께
export type MyComment = {
  id: string
  postId: string
  postTitle: string
  body: string
  likes: number
  createdAt: string
}

export type ActivityPage<T> = { items: T[]; nextCursor: string | null }

// 내가 쓴 글 · 공감한 글. 글 목록과 같은 모양
async function getPostPage(path: string, cursor?: string): Promise<ActivityPage<Post>> {
  const { data } = await apiClient.get<BaseResponse<PostListResponse>>(path, {
    params: { cursor, size: PAGE_SIZE },
  })
  if (!data.data) throw new Error('내 활동 응답이 비어 있음')
  return {
    items: data.data.items.flatMap((item) => toPost(item) ?? []),
    nextCursor: data.data.hasNext ? data.data.nextCursor : null,
  }
}

// 내가 쓴 글. 최신 먼저, 지운 · 가린 글 빼고
export const getMyPosts = (cursor?: string) => getPostPage('/me/posts', cursor)

// 공감한 글. 공감한 때가 최신인 것 먼저
export const getMyReactions = (cursor?: string) => getPostPage('/me/reactions', cursor)

// 내가 쓴 댓글. 최신 먼저, 지운 · 가린 댓글과 그 글 빼고
export async function getMyComments(cursor?: string): Promise<ActivityPage<MyComment>> {
  const { data } = await apiClient.get<
    BaseResponse<{ items: MyCommentResponse[]; nextCursor: string | null; hasNext: boolean }>
  >('/me/comments', { params: { cursor, size: PAGE_SIZE } })
  if (!data.data) throw new Error('내 댓글 응답이 비어 있음')
  return {
    items: data.data.items.map((item) => ({
      id: item.id,
      postId: item.postId,
      postTitle: item.postTitle,
      body: item.content,
      likes: item.reactionCount,
      createdAt: item.createdAt,
    })),
    nextCursor: data.data.hasNext ? data.data.nextCursor : null,
  }
}
