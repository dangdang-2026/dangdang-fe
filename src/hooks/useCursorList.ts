import { useCallback, useEffect, useRef, useState } from 'react'

type CursorPage<T> = { items: T[]; nextCursor: string | null }

type CursorListState<T> = {
  items: T[]
  nextCursor: string | null
  status: 'loading' | 'done' | 'error'
  loadingMore: boolean
}

// 커서로 받는 내 목록(찜 · 최근 본 · 판매처로 간 기록). 더 보기는 다음 장을 이어 붙임
export function useCursorList<P extends CursorPage<{ id: string }>>(
  load: (cursor?: string) => Promise<P>,
  onFirstPage?: (page: P) => void,
) {
  type T = P['items'][number]
  const [state, setState] = useState<CursorListState<T>>({
    items: [],
    nextCursor: null,
    status: 'loading',
    loadingMore: false,
  })
  const [reloadCount, setReloadCount] = useState(0)
  // 매 렌더 새로 만든 함수여도 처음 한 번만 받게
  const loadRef = useRef(load)
  const firstRef = useRef(onFirstPage)
  // 다시 받으면 올림. 그 전에 보낸 더 보기 응답은 버림(모두 지우기 뒤 지운 줄이 다시 붙지 않게)
  const generation = useRef(0)

  useEffect(() => {
    let stale = false
    loadRef
      .current()
      .then((page) => {
        if (stale) return
        firstRef.current?.(page)
        setState({
          items: page.items,
          nextCursor: page.nextCursor,
          status: 'done',
          loadingMore: false,
        })
      })
      .catch(() => {
        if (!stale) setState((prev) => ({ ...prev, status: 'error', loadingMore: false }))
      })
    return () => {
      stale = true
    }
  }, [reloadCount])

  const loadMore = useCallback(() => {
    if (!state.nextCursor || state.loadingMore) return
    const cursor = state.nextCursor
    const sent = generation.current
    setState((prev) => ({ ...prev, loadingMore: true }))
    loadRef
      .current(cursor)
      .then((page) => {
        if (sent !== generation.current) return
        setState((prev) => ({
          ...prev,
          // 그사이 새로 생긴 줄 때문에 겹친 건 한 번만
          items: [
            ...prev.items,
            ...page.items.filter((item) => !prev.items.some((p) => p.id === item.id)),
          ],
          nextCursor: page.nextCursor,
          loadingMore: false,
        }))
      })
      .catch(() => {
        if (sent === generation.current) setState((prev) => ({ ...prev, loadingMore: false }))
      })
  }, [state.nextCursor, state.loadingMore])

  const reload = useCallback(() => {
    generation.current += 1
    setState((prev) => ({ ...prev, loadingMore: false }))
    setReloadCount((count) => count + 1)
  }, [])

  // 찜 빼기 · 지우기처럼 화면에서 바로 바꿀 때
  const setItems = useCallback(
    (update: (items: T[]) => T[]) => setState((prev) => ({ ...prev, items: update(prev.items) })),
    [],
  )

  return {
    items: state.items,
    status: state.status,
    hasNext: !!state.nextCursor,
    loadingMore: state.loadingMore,
    loadMore,
    reload,
    setItems,
  }
}
