import { useCallback, useEffect, useState } from 'react'
import {
  getMyComments,
  getMyPosts,
  getMyReactions,
  type ActivityPage,
  type MyComment,
} from '@/api/myActivity'
import { useCommunityStore } from '@/stores/useCommunityStore'
import type { Post } from '@/types/community'
import type { ActivityType } from '@/utils/community'

type ActivityState = {
  type: ActivityType
  posts: Post[]
  comments: MyComment[]
  nextCursor: string | null
  status: 'done' | 'error'
  loadingMore: boolean
}

// 종류마다 한 장 받기. 글은 기기 글에도 넣어 상세로 바로 열리게
async function fetchPage(type: ActivityType, cursor?: string) {
  if (type === 'comments') {
    const page = await getMyComments(cursor)
    return { posts: [], comments: page.items, nextCursor: page.nextCursor }
  }
  const page: ActivityPage<Post> = await (type === 'posts' ? getMyPosts : getMyReactions)(cursor)
  useCommunityStore.getState().cachePosts(page.items)
  return { posts: page.items, comments: [], nextCursor: page.nextCursor }
}

// 내가 쓴 글 · 댓글 · 공감한 글. 처음 한 장을 받고 더 보기로 이어 붙임
export function useMyActivity(type: ActivityType) {
  const [state, setState] = useState<ActivityState | null>(null)
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let stale = false
    fetchPage(type)
      .then((page) => {
        if (!stale) setState({ type, ...page, status: 'done', loadingMore: false })
      })
      .catch(() => {
        if (!stale) {
          setState({
            type,
            posts: [],
            comments: [],
            nextCursor: null,
            status: 'error',
            loadingMore: false,
          })
        }
      })
    return () => {
      stale = true
    }
  }, [type, reloadCount])

  const current = state?.type === type ? state : null

  const loadMore = useCallback(() => {
    if (!current?.nextCursor || current.loadingMore) return
    setState({ ...current, loadingMore: true })
    fetchPage(type, current.nextCursor)
      .then((page) => {
        setState((prev) =>
          prev?.type === type
            ? {
                ...prev,
                posts: [...prev.posts, ...page.posts],
                comments: [...prev.comments, ...page.comments],
                nextCursor: page.nextCursor,
                loadingMore: false,
              }
            : prev,
        )
      })
      .catch(() => {
        setState((prev) => (prev?.type === type ? { ...prev, loadingMore: false } : prev))
      })
  }, [current, type])

  const reload = useCallback(() => setReloadCount((count) => count + 1), [])

  return {
    posts: current?.posts ?? [],
    comments: current?.comments ?? [],
    status: current?.status ?? 'loading',
    hasNext: !!current?.nextCursor,
    loadingMore: !!current?.loadingMore,
    loadMore,
    reload,
  }
}
