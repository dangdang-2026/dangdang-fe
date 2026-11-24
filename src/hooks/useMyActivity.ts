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
  // 더 보기를 못 받았는지
  moreFailed: boolean
}

// 화면에 못 그리는 글(당당 소식 등)만 있는 장은 건너뛰고 다음 장까지 받는 최대 수
const MAX_SKIP_PAGES = 5

// 종류마다 한 장 받기. 글은 기기 글에도 넣어 상세로 바로 열리게
async function fetchPage(type: ActivityType, cursor?: string) {
  if (type === 'comments') {
    const page = await getMyComments(cursor)
    return { posts: [], comments: page.items, nextCursor: page.nextCursor }
  }
  const get = type === 'posts' ? getMyPosts : getMyReactions
  let page: ActivityPage<Post> = await get(cursor)
  // 다 걸러져 빈 장이면 다음 장을 이어 받음. 빈 목록에 더 보기가 없어 멈추지 않게
  for (
    let skip = 0;
    page.items.length === 0 && page.nextCursor && skip < MAX_SKIP_PAGES;
    skip += 1
  ) {
    page = await get(page.nextCursor)
  }
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
        if (!stale) {
          setState({ type, ...page, status: 'done', loadingMore: false, moreFailed: false })
        }
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
            moreFailed: false,
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
    setState({ ...current, loadingMore: true, moreFailed: false })
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
        setState((prev) =>
          prev?.type === type ? { ...prev, loadingMore: false, moreFailed: true } : prev,
        )
      })
  }, [current, type])

  // 다시 받는 동안 불러오는 중으로 보이게 비움
  const reload = useCallback(() => {
    setState(null)
    setReloadCount((count) => count + 1)
  }, [])

  return {
    posts: current?.posts ?? [],
    comments: current?.comments ?? [],
    status: current?.status ?? 'loading',
    hasNext: !!current?.nextCursor,
    loadingMore: !!current?.loadingMore,
    moreFailed: !!current?.moreFailed,
    loadMore,
    reload,
  }
}
