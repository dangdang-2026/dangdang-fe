import { apiClient, type BaseResponse } from '@/api/axios'
import { MY_AUTHOR_ID } from '@/constants/community'
import type { BoardKey, Post, PostSort } from '@/types/community'

// 백엔드 PostCategory. NEWS는 당당 소식 공식 계정만
export type PostCategory =
  'NEWS' | 'MEAL' | 'MEASUREMENT' | 'VISIT' | 'MIND' | 'BIRTH' | 'POSTPARTUM'

// 화면 게시판 → 서버 게시판. 자유 · 질문은 서버에 없음
export const CATEGORY: Partial<Record<BoardKey, PostCategory>> = {
  diet: 'MEAL',
  measure: 'MEASUREMENT',
  visit: 'VISIT',
  mind: 'MIND',
  birth: 'POSTPARTUM',
}

// 서버 게시판 → 화면 게시판. 출산(BIRTH)도 출산·산후로, 당당 소식은 목록에서 뺌
const BOARD: Partial<Record<PostCategory, BoardKey>> = {
  MEAL: 'diet',
  MEASUREMENT: 'measure',
  VISIT: 'visit',
  MIND: 'mind',
  BIRTH: 'birth',
  POSTPARTUM: 'birth',
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
