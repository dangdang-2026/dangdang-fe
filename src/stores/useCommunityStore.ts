import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MOCK_POSTS } from '@/mocks/community'
import type { Author, BoardKey, Post, PostDraft } from '@/types/community'

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
  // 새 글 id를 돌려줌
  addPost: (input: { board: BoardKey; title: string; body: string; author: Author }) => string
  editPost: (postId: string, changes: Pick<Post, 'board' | 'title' | 'body'>) => void
  // 쓰다 나갈 때 임시 저장
  draft: PostDraft | null
  saveDraft: (draft: PostDraft) => void
  clearDraft: () => void
  // 신고 누적으로 글·댓글 막힌 기한. 서버 연동 전엔 직접 넣어 재현
  restrictedUntil: string | null
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
      draft: null,
      restrictedUntil: null,
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
      addPost: ({ board, title, body, author }) => {
        const id = crypto.randomUUID()
        const post: Post = {
          id,
          board,
          title,
          body,
          author,
          createdAt: new Date().toISOString(),
          views: 0,
          likes: 0,
          comments: [],
        }
        set((state) => ({ posts: [post, ...state.posts], draft: null }))
        return id
      },
      editPost: (postId, changes) =>
        set((state) => ({
          posts: updatePost(state.posts, postId, (post) => ({
            ...post,
            ...changes,
            editedAt: new Date().toISOString(),
          })),
        })),
      saveDraft: (draft) => set({ draft }),
      clearDraft: () => set({ draft: null }),
    }),
    { name: 'dangdang-community' },
  ),
)
