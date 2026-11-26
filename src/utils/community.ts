import { POPULAR_VIEWS } from '@/constants/community'
import type { Author, Post, PostSort } from '@/types/community'
import { diffInDays } from '@/utils/date'

// 예: 방금 전 / 10분 전 / 2시간 전 / 어제 / 3일 전 / 10/14
export function formatRelativeTime(iso: string, now: Date) {
  const at = new Date(iso)
  const minutes = Math.floor((now.getTime() - at.getTime()) / 60_000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const days = diffInDays(at, now)
  if (days === 0) return `${Math.floor(minutes / 60)}시간 전`
  if (days === 1) return '어제'
  if (days < 7) return `${days}일 전`
  return `${at.getMonth() + 1}/${at.getDate()}`
}

// 예: 임신 27주 · 산후 3개월. 서버 배지 글이 있으면 그대로, 없으면 주수로
export const formatAuthorWeek = (author: Author) =>
  author.badge ?? (author.pregnancyWeek ? `임신 ${author.pregnancyWeek}주` : null)

export const formatCount = (count: number) => count.toLocaleString('ko-KR')

export const isPopular = (post: Post) => post.views >= POPULAR_VIEWS

// 베스트 댓글로 칠 최소 공감 수
const BEST_MIN_LIKES = 10

// 베스트 댓글. 서버가 고른 게 있으면 그것, 서버 값이 없으면 공감이 가장 많은 원 댓글(가린 댓글 · 답글 빼고)
export function getBestComment(post: Post) {
  if (post.comments.some((item) => item.best !== undefined)) {
    return post.comments.find((item) => item.best && !item.hidden) ?? null
  }
  const candidates = post.comments.filter((item) => !item.hidden && !item.parentId)
  if (candidates.length === 0) return null
  const best = candidates.reduce((top, item) => (item.likes > top.likes ? item : top))
  return best.likes >= BEST_MIN_LIKES ? best : null
}

export function sortPosts(posts: Post[], sort: PostSort) {
  return [...posts].sort((a, b) =>
    sort === 'popular' ? b.views - a.views : b.createdAt.localeCompare(a.createdAt),
  )
}

export type ActivityType = 'posts' | 'comments' | 'liked'

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  posts: '내가 쓴 글',
  comments: '내가 쓴 댓글',
  liked: '공감한 글',
}

export const isActivityType = (value: string | null): value is ActivityType =>
  value !== null && value in ACTIVITY_LABEL

// 검색어 부분만 강조하려고 자름. 예: 식후 1시간 [알림], 밖에...
export function splitHighlight(text: string, query: string) {
  const words = query.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return [{ text, match: false }]
  const escaped = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return text
    .split(new RegExp(`(${escaped.join('|')})`, 'gi'))
    .filter(Boolean)
    .map((part) => ({
      text: part,
      match: words.some((word) => word.toLowerCase() === part.toLowerCase()),
    }))
}

// 약·용량처럼 병원에 물어야 할 검색어
export const isMedicalQuery = (query: string) => /약|용량|인슐린|처방|진단|주사|단위/.test(query)

export type PopularPeriod = 'realtime' | 'week' | 'month'

// 인기 게시판 기간. 실시간은 하루
export const POPULAR_PERIOD: Record<PopularPeriod, { label: string; days: number }> = {
  realtime: { label: '실시간', days: 1 },
  week: { label: '이번 주', days: 7 },
  month: { label: '이번 달', days: 30 },
}
