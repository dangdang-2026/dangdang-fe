import { apiClient, type BaseResponse } from '@/api/axios'
import { toAuthor, type AuthorResponse } from '@/api/posts'
import type { CommunityComment } from '@/types/community'

// 백엔드 CommentResponse. parentId가 있으면 답글
type CommentResponse = {
  id: string
  postId: string
  parentId: string | null
  content: string
  author: AuthorResponse
  createdAt: string
  visibility: 'VISIBLE' | 'HIDDEN'
  hiddenReason: string | null
  isMine: boolean
  reactionCount: number
  reacted: boolean
}

// 서버 댓글 → 화면 댓글
function toComment(item: CommentResponse): CommunityComment {
  return {
    id: item.id,
    author: toAuthor(item.author, `c${item.id}`),
    body: item.content,
    createdAt: item.createdAt,
    likes: item.reactionCount,
    liked: item.reacted,
    parentId: item.parentId ?? undefined,
    hidden: item.visibility === 'HIDDEN',
  }
}

// 댓글 목록. 오래된 순, 지우거나 가린 댓글과 그 답글은 빠짐
export async function getComments(postId: string) {
  const { data } = await apiClient.get<
    BaseResponse<{ items: CommentResponse[]; totalCount: number }>
  >(`/posts/${postId}/comments`)
  if (!data.data) throw new Error('댓글 목록 응답이 비어 있음')
  return { comments: data.data.items.map(toComment), total: data.data.totalCount }
}

// 댓글 · 답글 쓰기(1000자). 답글의 답글은 COMMENT_40001, 이용 제한 중 403 COMMUNITY_40301
export async function createComment(postId: string, body: string, parentId?: string) {
  const { data } = await apiClient.post<BaseResponse<CommentResponse>>(
    `/posts/${postId}/comments`,
    { content: body, parentId, isAnonymous: false },
  )
  if (!data.data) throw new Error('댓글 쓰기 응답이 비어 있음')
  return toComment(data.data)
}

// 내 댓글 지우기
export async function deleteComment(commentId: string) {
  await apiClient.delete(`/comments/${commentId}`)
}
