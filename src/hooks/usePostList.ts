import { useCallback, useEffect, useMemo, useState } from 'react'
import { getPosts, type PostListQuery } from '@/api/posts'
import { useCommunityStore } from '@/stores/useCommunityStore'
import type { Post } from '@/types/community'

export type PostListStatus = 'loading' | 'done' | 'error'

type PostListState = {
  key: string
  posts: Post[]
  nextCursor: string | null
  status: PostListStatus
  loadingMore: boolean
}

// 서버 글 목록. 조건이 바뀌면 처음부터, 더 보기는 다음 장을 이어 붙임. 안 보기로 한 사람 글은 뺌
export function usePostList(query: PostListQuery, enabled = true) {
  const key = JSON.stringify(query)
  const cachePosts = useCommunityStore((state) => state.cachePosts)
  const blockedAuthors = useCommunityStore((state) => state.blockedAuthors)
  // 상세에서 공감 · 댓글이 바뀌면 목록에도 보이게 기기 글로 맞춤
  const cached = useCommunityStore((state) => state.posts)
  const [state, setState] = useState<PostListState | null>(null)
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let stale = false
    getPosts(JSON.parse(key) as PostListQuery)
      .then(({ posts, nextCursor }) => {
        if (stale) return
        cachePosts(posts)
        setState({ key, posts, nextCursor, status: 'done', loadingMore: false })
      })
      .catch(() => {
        if (!stale)
          setState({ key, posts: [], nextCursor: null, status: 'error', loadingMore: false })
      })
    return () => {
      stale = true
    }
  }, [key, enabled, reloadCount, cachePosts])

  const current = state?.key === key ? state : null

  const loadMore = useCallback(() => {
    if (!current?.nextCursor || current.loadingMore) return
    setState({ ...current, loadingMore: true })
    getPosts(JSON.parse(key) as PostListQuery, current.nextCursor)
      .then(({ posts, nextCursor }) => {
        cachePosts(posts)
        setState((prev) =>
          prev?.key === key
            ? { ...prev, posts: [...prev.posts, ...posts], nextCursor, loadingMore: false }
            : prev,
        )
      })
      .catch(() => {
        setState((prev) => (prev?.key === key ? { ...prev, loadingMore: false } : prev))
      })
  }, [current, key, cachePosts])

  const reload = useCallback(() => setReloadCount((count) => count + 1), [])

  const posts = useMemo(() => {
    const blocked = new Set(blockedAuthors.map((author) => author.id))
    const byId = new Map(cached.map((post) => [post.id, post]))
    return (current?.posts ?? [])
      .filter((post) => !blocked.has(post.author.id))
      .map((post) => byId.get(post.id) ?? post)
  }, [current, blockedAuthors, cached])

  return {
    posts,
    status: (current?.status ?? 'loading') as PostListStatus,
    hasNext: !!current?.nextCursor,
    loadingMore: !!current?.loadingMore,
    loadMore,
    reload,
  }
}
