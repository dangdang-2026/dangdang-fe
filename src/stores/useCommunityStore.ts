import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getErrorCode } from '@/api/axios'
import { getMyCommunityProfile } from '@/api/communityProfile'
import { createComment, deleteComment, getComments } from '@/api/comments'
import { savePostDraft, votePoll } from '@/api/posts'
import { reactComment, reactPost } from '@/api/reactions'
import { MY_AUTHOR_ID } from '@/constants/community'
import type { Author, CommunityComment, Post, PostDraft, ReportReason } from '@/types/community'

type CommunityState = {
  // 커뮤니티 첫 진입에 정함. 안 정했으면 null
  nickname: string | null
  // 글·댓글 옆에 임신 주수 배지
  showWeek: boolean
  // 서버에서 받은 글. 목록 · 상세에서 받을 때마다 맞춤
  posts: Post[]
  // full이면 상세 글이라 본문까지 그대로 바꿈
  cachePosts: (posts: Post[], full?: boolean) => void
  // 메인 안내 띠를 닫았는지
  noticeDismissed: boolean
  // 바꾸면 내가 쓴 글·댓글 이름도 함께 바뀜(익명 글 빼고)
  setNickname: (nickname: string, showWeek?: boolean) => void
  setShowWeek: (showWeek: boolean) => void
  dismissNotice: () => void
  // 공감 여부 · 수를 바꿈. 서버 응답이나 누르자마자 보여 줄 값
  setPostLike: (postId: string, liked: boolean, likes: number) => void
  setCommentLike: (postId: string, commentId: string, liked: boolean, likes: number) => void
  // 서버 댓글 목록 · 전체 수로 바꿈
  setComments: (postId: string, comments: CommunityComment[], total: number) => void
  // 서버에 남긴 댓글을 붙임
  addComment: (postId: string, comment: CommunityComment) => void
  removeComment: (postId: string, commentId: string) => void
  // 서버 투표 결과로 바꿈
  setPoll: (postId: string, poll: Pick<Post, 'poll' | 'pollTotal' | 'myVote'>) => void
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

// 목록 본문은 앞 100자. 그보다 짧으면 본문 전체
const EXCERPT_LENGTH = 100
// 기기에 둘 글 수. 넘으면 오래된 글부터 버리고 내 글은 남김
const MAX_CACHED_POSTS = 300

// 오래된 글부터 버림. 내 글은 커뮤니티 활동에서 보여서 남김
function trimPosts(posts: Post[]) {
  if (posts.length <= MAX_CACHED_POSTS) return posts
  const keep = new Set(
    [...posts]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, MAX_CACHED_POSTS)
      .map((post) => post.id),
  )
  return posts.filter((post) => keep.has(post.id) || post.author.id === MY_AUTHOR_ID)
}

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
      body:
        full || [...next.body].length < EXCERPT_LENGTH || next.body.length >= post.body.length
          ? next.body
          : post.body,
      comments: next.comments.length > 0 ? next.comments : post.comments,
      poll: next.poll?.length ? next.poll : (post.poll ?? next.poll),
    }
  })
  return trimPosts([...merged, ...byId.values()])
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
      noticeDismissed: false,
      draft: null,
      restrictedUntil: null,
      reports: [],
      blockedAuthors: [],
      likedNewsIds: [],

      dismissedNewsId: null,
      setNickname: (nickname, showWeek) =>
        set((state) => ({
          nickname,
          showWeek: showWeek ?? state.showWeek,
          posts: renameMe(state.posts, state.nickname, nickname),
        })),
      setShowWeek: (showWeek) => set({ showWeek }),
      dismissNotice: () => set({ noticeDismissed: true }),
      setPostLike: (postId, liked, likes) =>
        set((state) => ({
          posts: updatePost(state.posts, postId, (post) => ({ ...post, liked, likes })),
        })),
      setCommentLike: (postId, commentId, liked, likes) =>
        set((state) => ({
          posts: updatePost(state.posts, postId, (post) => ({
            ...post,
            comments: post.comments.map((item) =>
              item.id === commentId ? { ...item, liked, likes } : item,
            ),
          })),
        })),
      setComments: (postId, comments, total) =>
        set((state) => ({
          posts: updatePost(state.posts, postId, (post) => ({
            ...post,
            comments,
            commentCount: total,
          })),
        })),
      addComment: (postId, comment) =>
        set((state) => ({
          posts: updatePost(state.posts, postId, (post) => ({
            ...post,
            comments: [...post.comments, comment],
            commentCount: post.commentCount + 1,
          })),
        })),
      // 답글이 달린 댓글을 지우면 답글도 함께
      removeComment: (postId, commentId) =>
        set((state) => ({
          posts: updatePost(state.posts, postId, (post) => {
            const comments = post.comments.filter(
              (item) => item.id !== commentId && item.parentId !== commentId,
            )
            const removed = post.comments.length - comments.length
            return { ...post, comments, commentCount: Math.max(0, post.commentCount - removed) }
          }),
        })),
      setPoll: (postId, poll) =>
        set((state) => ({
          posts: updatePost(state.posts, postId, (post) => ({ ...post, ...poll })),
        })),
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

// 임시 저장. 기기에 먼저 두고 서버에도 남겨 다른 기기에서 이어 씀
export function keepPostDraft(draft: PostDraft) {
  useCommunityStore.getState().saveDraft(draft)
  return savePostDraft(draft)
}

// 임시 글 버리기. 서버엔 지우기 API가 없어 빈 글로 덮어씀
export function dropPostDraft() {
  useCommunityStore.getState().clearDraft()
  return savePostDraft(null)
}

// 서버 댓글로 글 화면을 맞춤
export async function loadComments(postId: string) {
  const { comments, total } = await getComments(postId)
  useCommunityStore.getState().setComments(postId, comments, total)
}

// 서버에 댓글 · 답글을 남긴 뒤 글에 붙임
export async function writeComment(postId: string, body: string, parentId?: string) {
  const comment = await createComment(postId, body, parentId)
  useCommunityStore.getState().addComment(postId, comment)
}

// 서버에서 지운 뒤 글에서 뺌. 이미 없는 댓글이어도 지운 걸로
export async function eraseComment(postId: string, commentId: string) {
  try {
    await deleteComment(commentId)
  } catch (error) {
    if (getErrorCode(error) !== 'COMMENT_40401') throw error
  }
  useCommunityStore.getState().removeComment(postId, commentId)
}

// 서버에 보내는 중인 공감 · 투표. 빠르게 두 번 눌러 요청이 엇갈리지 않게 끝날 때까지 무시
const sending = new Set<string>()

async function once(key: string, job: () => Promise<void>) {
  if (sending.has(key)) return
  sending.add(key)
  try {
    await job()
  } finally {
    sending.delete(key)
  }
}

// 글 공감 누르기 · 취소. 바로 보여 주고 서버 수로 맞춤, 못 남기면 되돌림
export function toggleLikePost(postId: string) {
  return once(`post:${postId}`, () => likePost(postId))
}

async function likePost(postId: string) {
  const post = useCommunityStore.getState().posts.find((item) => item.id === postId)
  if (!post) return
  const { setPostLike } = useCommunityStore.getState()
  const on = !post.liked
  setPostLike(postId, on, Math.max(0, post.likes + (on ? 1 : -1)))
  try {
    const result = await reactPost(postId, on)
    setPostLike(postId, result.liked, result.likes)
  } catch (error) {
    setPostLike(postId, !!post.liked, post.likes)
    throw error
  }
}

// 댓글 공감 누르기 · 취소
export function toggleLikeComment(postId: string, commentId: string) {
  return once(`comment:${commentId}`, () => likeComment(postId, commentId))
}

async function likeComment(postId: string, commentId: string) {
  const post = useCommunityStore.getState().posts.find((item) => item.id === postId)
  const comment = post?.comments.find((item) => item.id === commentId)
  if (!comment) return
  const { setCommentLike } = useCommunityStore.getState()
  const on = !comment.liked
  setCommentLike(postId, commentId, on, Math.max(0, comment.likes + (on ? 1 : -1)))
  try {
    const result = await reactComment(commentId, on)
    setCommentLike(postId, commentId, result.liked, result.likes)
  } catch (error) {
    setCommentLike(postId, commentId, !!comment.liked, comment.likes)
    throw error
  }
}

// 투표. 고르면 서버 결과(항목별 수 · 참여 인원)로 바꿈. 한 번 고르면 바꿀 수 없음
export function voteOnPost(postId: string, optionId: string) {
  return once(`vote:${postId}`, async () => {
    const poll = await votePoll(postId, optionId)
    useCommunityStore.getState().setPoll(postId, poll)
  })
}
