import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MOCK_POSTS } from '@/mocks/community'
import type { Author, Post } from '@/types/community'

type CommunityState = {
  // 커뮤니티 첫 진입에 정함. 안 정했으면 null
  nickname: string | null
  // 글·댓글 옆에 임신 주수 배지
  showWeek: boolean
  posts: Post[]
  likedPostIds: string[]
  likedCommentIds: string[]
  // 메인 안내 띠를 닫았는지
  noticeDismissed: boolean
  setNickname: (nickname: string, showWeek?: boolean) => void
  dismissNotice: () => void
  viewPost: (postId: string) => void
  toggleLikePost: (postId: string) => void
  toggleLikeComment: (postId: string, commentId: string) => void
  addComment: (postId: string, author: Author, body: string, parentId?: string) => void
  removeComment: (postId: string, commentId: string) => void
}

// 글 하나만 바꿔 끼움
const updatePost = (posts: Post[], postId: string, update: (post: Post) => Post) =>
  posts.map((post) => (post.id === postId ? update(post) : post))

const toggle = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]

// API 연동 전까지 mock 글로 시작해 기기에 저장
export const useCommunityStore = create<CommunityState>()(
  persist(
    (set) => ({
      nickname: null,
      showWeek: false,
      posts: MOCK_POSTS,
      likedPostIds: [],
      likedCommentIds: [],
      noticeDismissed: false,
      setNickname: (nickname, showWeek) =>
        set((state) => ({ nickname, showWeek: showWeek ?? state.showWeek })),
      dismissNotice: () => set({ noticeDismissed: true }),
      viewPost: (postId) =>
        set((state) => ({
          posts: updatePost(state.posts, postId, (post) => ({ ...post, views: post.views + 1 })),
        })),
      toggleLikePost: (postId) =>
        set((state) => {
          const liked = state.likedPostIds.includes(postId)
          return {
            likedPostIds: toggle(state.likedPostIds, postId),
            posts: updatePost(state.posts, postId, (post) => ({
              ...post,
              likes: post.likes + (liked ? -1 : 1),
            })),
          }
        }),
      toggleLikeComment: (postId, commentId) =>
        set((state) => {
          const liked = state.likedCommentIds.includes(commentId)
          return {
            likedCommentIds: toggle(state.likedCommentIds, commentId),
            posts: updatePost(state.posts, postId, (post) => ({
              ...post,
              comments: post.comments.map((item) =>
                item.id === commentId ? { ...item, likes: item.likes + (liked ? -1 : 1) } : item,
              ),
            })),
          }
        }),
      addComment: (postId, author, body, parentId) =>
        set((state) => ({
          posts: updatePost(state.posts, postId, (post) => ({
            ...post,
            comments: [
              ...post.comments,
              {
                id: crypto.randomUUID(),
                author,
                body,
                createdAt: new Date().toISOString(),
                likes: 0,
                parentId,
              },
            ],
          })),
        })),
      // 답글이 달린 댓글을 지우면 답글도 함께
      removeComment: (postId, commentId) =>
        set((state) => ({
          posts: updatePost(state.posts, postId, (post) => ({
            ...post,
            comments: post.comments.filter(
              (item) => item.id !== commentId && item.parentId !== commentId,
            ),
          })),
        })),
    }),
    { name: 'dangdang-community' },
  ),
)
