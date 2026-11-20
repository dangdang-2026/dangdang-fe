import { apiClient, type BaseResponse } from '@/api/axios'

// 백엔드 ReactionResponse. 글 · 댓글 공감이 같이 씀
type ReactionResponse = { reacted: boolean; reactionCount: number }

// 공감 누르기 · 취소. 다시 눌러도 · 안 누른 걸 취소해도 200
async function react(path: string, on: boolean) {
  const { data } = on
    ? await apiClient.post<BaseResponse<ReactionResponse>>(path)
    : await apiClient.delete<BaseResponse<ReactionResponse>>(`${path}/me`)
  if (!data.data) throw new Error('공감 응답이 비어 있음')
  return { liked: data.data.reacted, likes: data.data.reactionCount }
}

export const reactPost = (postId: string, on: boolean) => react(`/posts/${postId}/reactions`, on)

export const reactComment = (commentId: string, on: boolean) =>
  react(`/comments/${commentId}/reactions`, on)
