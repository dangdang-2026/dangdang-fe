import { apiClient, type BaseResponse } from '@/api/axios'
import { MY_AUTHOR_ID } from '@/constants/community'
import type { BoardKey, Post, PostDraft, PostSort } from '@/types/community'

// 백엔드 PostCategory. NEWS는 당당 소식 공식 계정만
export type PostCategory =
  'NEWS' | 'MEAL' | 'MEASUREMENT' | 'VISIT' | 'MIND' | 'BIRTH' | 'POSTPARTUM' | 'FREE' | 'QUESTION'

// 화면 게시판 → 서버 게시판
export const CATEGORY: Partial<Record<BoardKey, PostCategory>> = {
  diet: 'MEAL',
  measure: 'MEASUREMENT',
  visit: 'VISIT',
  mind: 'MIND',
  birth: 'POSTPARTUM',
  free: 'FREE',
  question: 'QUESTION',
}

// 서버 게시판 → 화면 게시판. 출산(BIRTH)도 출산·산후로, 당당 소식은 목록에서 뺌
const BOARD: Partial<Record<PostCategory, BoardKey>> = {
  MEAL: 'diet',
  MEASUREMENT: 'measure',
  VISIT: 'visit',
  MIND: 'mind',
  BIRTH: 'birth',
  POSTPARTUM: 'birth',
  FREE: 'free',
  QUESTION: 'question',
}

// 백엔드 AuthorResponse. 익명이면 profileId 없음, 탈퇴한 회원이면 displayName만
export type AuthorResponse = {
  profileId: string | null
  displayName: string
  weekBadge: string | null
  isMine: boolean
}

// 백엔드 PostSummaryResponse. excerpt는 본문 앞 100자
type PostSummaryResponse = {
  id: string
  category: PostCategory
  title: string
  excerpt: string
  author: AuthorResponse
  createdAt: string
  viewCount: number
  reactionCount: number
  commentCount: number
  reacted: boolean
  hasPoll: boolean
}

type PostListResponse = {
  items: PostSummaryResponse[]
  nextCursor: string | null
  hasNext: boolean
}

// 주수 배지. 예: "임신 27주" → 27
const toWeek = (badge: string | null) => {
  const week = Number(badge?.match(/(\d+)\s*주/)?.[1])
  return Number.isFinite(week) && week > 0 ? week : null
}

// 서버 글쓴이 → 화면 글쓴이. 내 글은 MY_AUTHOR_ID, 익명 · 탈퇴는 글마다 다른 id로 차단 대상에서 빠지게
export function toAuthor(author: AuthorResponse, fallbackId: string) {
  return {
    id: author.isMine ? MY_AUTHOR_ID : (author.profileId ?? `anon-${fallbackId}`),
    nickname: author.displayName,
    pregnancyWeek: toWeek(author.weekBadge),
  }
}

// 서버 글 한 줄 → 화면 글. 목록엔 본문 앞부분 · 댓글 수만 와서 댓글은 비움, 투표는 있다는 표시만
function toPost(item: PostSummaryResponse): Post | null {
  const board = BOARD[item.category]
  if (!board) return null
  return {
    id: item.id,
    board,
    title: item.title,
    body: item.excerpt,
    author: toAuthor(item.author, item.id),
    createdAt: item.createdAt,
    views: item.viewCount,
    likes: item.reactionCount,
    liked: item.reacted,
    commentCount: item.commentCount,
    comments: [],
    poll: item.hasPoll ? [] : undefined,
  }
}

export type PopularPeriod = 'realtime' | 'week' | 'month'
export type PostAudience = 'all' | 'pregnant' | 'postpartum'

export type PostListQuery = {
  board?: BoardKey
  sort: PostSort
  // 인기순일 때만
  period?: PopularPeriod
  audience?: PostAudience
  q?: string
}

const PAGE_SIZE = 20

// 글 목록 한 장. 인기순은 50개 한 장이라 다음 장 없음
export async function getPosts(query: PostListQuery, cursor?: string) {
  const { data } = await apiClient.get<BaseResponse<PostListResponse>>('/posts', {
    params: {
      category: query.board ? CATEGORY[query.board] : undefined,
      q: query.q?.trim() || undefined,
      sort: query.sort === 'popular' ? 'POPULAR' : 'LATEST',
      period: query.sort === 'popular' ? query.period?.toUpperCase() : undefined,
      audience: query.audience?.toUpperCase(),
      cursor,
      size: PAGE_SIZE,
    },
  })
  if (!data.data) throw new Error('글 목록 응답이 비어 있음')
  return {
    posts: data.data.items.flatMap((item) => toPost(item) ?? []),
    nextCursor: data.data.hasNext ? data.data.nextCursor : null,
  }
}

// 백엔드 PollResponse. voteCount는 투표한 사람에게만 옴
type PollResponse = {
  options: { index: number; text: string; voteCount: number | null }[]
  totalVotes: number
  myOptionIndex: number | null
}

// 백엔드 PostDetailResponse. 가려진 글은 제목 · 본문 · 글쓴이 없이 hiddenReason만
type PostDetailResponse = {
  id: string
  category: PostCategory
  title: string | null
  content: string | null
  author: AuthorResponse | null
  createdAt: string
  updatedAt: string
  viewCount: number
  reactionCount: number
  commentCount: number
  reacted: boolean
  isMine: boolean
  visibility: 'VISIBLE' | 'HIDDEN'
  hiddenReason: string | null
  poll: PollResponse | null
}

// 서버 투표 → 화면 투표. 항목 id는 서버 항목 번호
function toPoll(poll: PollResponse) {
  return {
    poll: poll.options.map((option) => ({
      id: String(option.index),
      label: option.text,
      votes: option.voteCount ?? 0,
    })),
    pollTotal: poll.totalVotes,
    myVote: poll.myOptionIndex !== null ? String(poll.myOptionIndex) : null,
  }
}

// 저장 직후 updatedAt이 createdAt과 조금 달라도 고친 걸로 보지 않음
const EDITED_GAP_MS = 1000

// 서버 글 상세 → 화면 글. 투표 항목 id는 서버 항목 번호, 댓글은 댓글 API로 따로
function toPostDetail(item: PostDetailResponse): Post {
  const edited =
    new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime() > EDITED_GAP_MS
  return {
    id: item.id,
    board: BOARD[item.category] ?? 'free',
    title: item.title ?? '',
    body: item.content ?? '',
    author: item.author
      ? toAuthor(item.author, item.id)
      : { id: `anon-${item.id}`, nickname: '', pregnancyWeek: null },
    createdAt: item.createdAt,
    editedAt: edited ? item.updatedAt : undefined,
    views: item.viewCount,
    likes: item.reactionCount,
    liked: item.reacted,
    commentCount: item.commentCount,
    comments: [],
    hidden: item.visibility === 'HIDDEN',
    hiddenReason: item.hiddenReason ?? undefined,
    ...(item.poll ? toPoll(item.poll) : { poll: undefined, pollTotal: undefined, myVote: null }),
  }
}

// 글 상세. 서버가 조회수를 올림. 없거나 지운 글은 404 POST_40401
export async function getPost(postId: string) {
  const { data } = await apiClient.get<BaseResponse<PostDetailResponse>>(`/posts/${postId}`)
  if (!data.data) throw new Error('글 상세 응답이 비어 있음')
  return toPostDetail(data.data)
}

export type PostInput = {
  board: BoardKey
  title: string
  body: string
  anonymous: boolean
  // 투표 항목 2~5개. 없으면 투표 없음
  poll?: string[]
}

// 글 쓰기. 프로필 없음 404 COMMUNITY_40401, 이용 제한 중 403 COMMUNITY_40301
export async function createPost(input: PostInput) {
  const { data } = await apiClient.post<BaseResponse<PostDetailResponse>>('/posts', {
    category: CATEGORY[input.board],
    title: input.title,
    content: input.body,
    isAnonymous: input.anonymous,
    poll: input.poll,
  })
  if (!data.data) throw new Error('글 쓰기 응답이 비어 있음')
  return toPostDetail(data.data)
}

// 글 고치기. 투표 · 익명은 못 바꿈
export async function updatePost(
  postId: string,
  changes: Pick<PostInput, 'board' | 'title' | 'body'>,
) {
  const { data } = await apiClient.patch<BaseResponse<PostDetailResponse>>(`/posts/${postId}`, {
    category: CATEGORY[changes.board],
    title: changes.title,
    content: changes.body,
  })
  if (!data.data) throw new Error('글 고치기 응답이 비어 있음')
  return toPostDetail(data.data)
}

// 글 지우기
export async function deletePost(postId: string) {
  await apiClient.delete(`/posts/${postId}`)
}

// 백엔드 PostDraftResponse. 쓰다 만 글이라 칸이 비어 있을 수 있음
type PostDraftResponse = {
  id: string
  category: PostCategory | null
  title: string | null
  content: string | null
  isAnonymous: boolean
  poll: string[] | null
  updatedAt: string
}

// 내 임시 글. 한 사람에 하나, 비어 있으면 없는 걸로
export async function getPostDraft(): Promise<PostDraft | null> {
  const { data } =
    await apiClient.get<BaseResponse<{ items: PostDraftResponse[] }>>('/posts/drafts')
  const item = data.data?.items[0]
  if (!item || (!item.title && !item.content && !item.poll?.length)) return null
  return {
    board: (item.category && BOARD[item.category]) || null,
    title: item.title ?? '',
    body: item.content ?? '',
    anonymous: item.isAnonymous,
    poll: item.poll?.length ? item.poll : null,
  }
}

// 임시 저장. 있으면 덮어씀. 비운 글을 보내면 지운 것과 같음(지우기 API 없음)
export async function savePostDraft(draft: PostDraft | null) {
  await apiClient.put('/posts/drafts', {
    category: draft?.board ? CATEGORY[draft.board] : undefined,
    title: draft?.title || undefined,
    content: draft?.body || undefined,
    isAnonymous: draft?.anonymous ?? false,
    poll: draft?.poll?.length ? draft.poll : undefined,
  })
}

type PrecheckIssue = { kind: 'DOSE' | 'URGENT_MEDICAL' | 'MIND'; quote: string }

// 올리기 전 문장 확인(AI). 위급 · 마음 위기가 먼저(U-30), 그다음 약 · 용량(U-15)
// AI 서버가 꺼졌거나 늦으면 checked=false로 와서 undefined를 돌려줌
export async function precheckPost(title: string, body: string) {
  const { data } = await apiClient.post<
    BaseResponse<{ issues: PrecheckIssue[]; checked: boolean }>
  >('/posts/precheck', { title, content: body })
  if (!data.data?.checked) return undefined
  const { issues } = data.data
  const urgent = issues.find((issue) => issue.kind !== 'DOSE')
  const dose = issues.find((issue) => issue.kind === 'DOSE')
  if (urgent) return { kind: 'urgent' as const, quote: urgent.quote }
  if (dose) return { kind: 'dose' as const, quote: dose.quote }
  return null
}

// 투표. 고른 뒤 항목별 수가 옴. 같은 항목 다시 200, 다른 항목 409 POST_40901
export async function votePoll(postId: string, optionId: string) {
  const { data } = await apiClient.post<BaseResponse<PollResponse>>(`/posts/${postId}/poll/votes`, {
    optionIndex: Number(optionId),
  })
  if (!data.data) throw new Error('투표 응답이 비어 있음')
  return toPoll(data.data)
}
