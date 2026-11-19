import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getMyCommunityProfile } from '@/api/communityProfile'
import { MY_AUTHOR_ID } from '@/constants/community'
import type { Author, Post, PostDraft, ReportReason } from '@/types/community'

type CommunityState = {
  // 커뮤니티 첫 진입에 정함. 안 정했으면 null
  nickname: string | null
  // 글·댓글 옆에 임신 주수 배지
  showWeek: boolean
  // 서버에서 받은 글. 목록 · 상세에서 받을 때마다 맞춤
  posts: Post[]
  // full이면 상세 글이라 본문까지 그대로 바꿈
  cachePosts: (posts: Post[], full?: boolean) => void
  likedPostIds: string[]
  likedCommentIds: string[]
  // 메인 안내 띠를 닫았는지
  noticeDismissed: boolean
  // 바꾸면 내가 쓴 글·댓글 이름도 함께 바뀜(익명 글 빼고)
  setNickname: (nickname: string, showWeek?: boolean) => void
  setShowWeek: (showWeek: boolean) => void
  dismissNotice: () => void
  toggleLikePost: (postId: string) => void
  toggleLikeComment: (postId: string, commentId: string) => void
  addComment: (postId: string, author: Author, body: string, parentId?: string) => void
  removeComment: (postId: string, commentId: string) => void
  // 글 id → 내가 고른 투표 항목 id
  votes: Record<string, string>
  vote: (postId: string, optionId: string) => void
  // 쓰다 나갈 때 임시 저장
  draft: PostDraft | null
  saveDraft: (draft: PostDraft) => void
  clearDraft: () => void
  // 신고 누적으로 글·댓글 막힌 기한. 서버 연동 전엔 직접 넣어 재현
  restrictedUntil: string | null
  removePost: (postId: string) => void
  // 신고한 글 id와 이유. 서버 연동 전엔 기록만
  reports: { postId: string; reason: ReportReason }[]
  reportPost: (postId: string, reason: ReportReason) => void
  // 이 사람 글 안 보기
  blockedAuthors: Pick<Author, 'id' | 'nickname'>[]
  blockAuthor: (author: Author) => void
  unblockAuthor: (authorId: string) => void
  // 당당 소식 카드 공감·저장
  likedNewsIds: string[]

  toggleLikeNews: (newsId: string) => void

  // 커뮤니티 메인에서 닫은 소식 카드. 새 카드가 걸리면 다시 보임
  dismissedNewsId: number | null
  dismissNewsCard: (id: number) => void
}

// 글 하나만 바꿔 끼움
const updatePost = (posts: Post[], postId: string, update: (post: Post) => Post) =>
  posts.map((post) => (post.id === postId ? update(post) : post))

// 내 이름으로 쓴 글쓴이만 새 이름으로
const renameMe = (posts: Post[], from: string | null, to: string) => {
  const rename = (author: Author) =>
    author.id === MY_AUTHOR_ID && author.nickname === from ? { ...author, nickname: to } : author
  return posts.map((post) => ({
    ...post,
    author: rename(post.author),
    comments: post.comments.map((item) => ({ ...item, author: rename(item.author) })),
  }))
}

const toggle = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]

// 받은 글은 그대로 바꿔 끼움. 상세에서 받은 댓글 · 투표 항목은 목록 글로 덮지 않음
const mergePosts = (posts: Post[], incoming: Post[], full: boolean) => {
  const byId = new Map(incoming.map((post) => [post.id, post]))
  const merged = posts.map((post) => {
    const next = byId.get(post.id)
    if (!next) return post
    byId.delete(post.id)
    return {
      ...post,
      ...next,
      // 목록은 본문 앞부분만 와서 상세에서 받은 본문을 남김
      body: full || next.body.length >= post.body.length ? next.body : post.body,
      comments: next.comments.length > 0 ? next.comments : post.comments,
      poll: next.poll?.length ? next.poll : (post.poll ?? next.poll),
    }
  })
  return [...merged, ...byId.values()]
}

// 커뮤니티 글은 서버에서 받아 기기에도 둠
export const useCommunityStore = create<CommunityState>()(
  persist(
    (set) => ({
      nickname: null,
      showWeek: false,
      posts: [],
      cachePosts: (posts, full = false) =>
        set((state) => ({ posts: mergePosts(state.posts, posts, full) })),
      likedPostIds: [],
      likedCommentIds: [],
      noticeDismissed: false,
      draft: null,
      restrictedUntil: null,
      reports: [],
      blockedAuthors: [],
      likedNewsIds: [],
      votes: {},

      dismissedNewsId: null,
      setNickname: (nickname, showWeek) =>
        set((state) => ({
          nickname,
          showWeek: showWeek ?? state.showWeek,
          posts: renameMe(state.posts, state.nickname, nickname),
        })),
      setShowWeek: (showWeek) => set({ showWeek }),
      dismissNotice: () => set({ noticeDismissed: true }),
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
      // 한 번 고르면 바꿀 수 없음
      vote: (postId, optionId) =>
        set((state) => {
          if (state.votes[postId]) return state
          return {
            votes: { ...state.votes, [postId]: optionId },
            posts: updatePost(state.posts, postId, (post) => ({
              ...post,
              poll: post.poll?.map((option) =>
                option.id === optionId ? { ...option, votes: option.votes + 1 } : option,
              ),
            })),
          }
        }),
      saveDraft: (draft) => set({ draft }),
      clearDraft: () => set({ draft: null }),
      removePost: (postId) =>
        set((state) => ({ posts: state.posts.filter((post) => post.id !== postId) })),
      reportPost: (postId, reason) =>
        set((state) => ({ reports: [...state.reports, { postId, reason }] })),
      blockAuthor: ({ id, nickname }) =>
        set((state) => ({
          blockedAuthors: [
            ...state.blockedAuthors.filter((item) => item.id !== id),
            { id, nickname },
          ],
        })),
      toggleLikeNews: (newsId) =>
        set((state) => ({ likedNewsIds: toggle(state.likedNewsIds, newsId) })),
      dismissNewsCard: (id) => set({ dismissedNewsId: id }),
      unblockAuthor: (authorId) =>
        set((state) => ({
          blockedAuthors: state.blockedAuthors.filter((item) => item.id !== authorId),
        })),
    }),
    {
      name: 'dangdang-community',
      // 1: 연동 전 가짜 글을 지움
      version: 1,
      migrate: (persisted) => ({ ...(persisted as CommunityState), posts: [] }),
    },
  ),
)

// 서버 커뮤니티 프로필로 맞춤. 프로필이 없는 계정이면 닉네임을 비워 처음 들어올 때 정하게
export async function syncCommunityProfile() {
  const profile = await getMyCommunityProfile()
  if (profile) useCommunityStore.getState().setNickname(profile.nickname, profile.showWeek)
  else useCommunityStore.setState({ nickname: null, showWeek: false })
}
