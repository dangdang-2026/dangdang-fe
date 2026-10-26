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

// 예: 임신 27주. 주수를 모르면 없음
export const formatAuthorWeek = (author: Author) =>
  author.pregnancyWeek ? `임신 ${author.pregnancyWeek}주` : null

export const formatCount = (count: number) => count.toLocaleString('ko-KR')

export const isPopular = (post: Post) => post.views >= POPULAR_VIEWS

// 공감이 가장 많은 댓글. 없으면 null
export function getBestComment(post: Post) {
  if (post.comments.length === 0) return null
  return post.comments.reduce((best, item) => (item.likes > best.likes ? item : best))
}

export function sortPosts(posts: Post[], sort: PostSort) {
  return [...posts].sort((a, b) =>
    sort === 'popular' ? b.views - a.views : b.createdAt.localeCompare(a.createdAt),
  )
}
