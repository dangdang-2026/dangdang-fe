import { useCallback, useEffect, useRef, useState } from 'react'
import { getProducts, type Product, type ProductQuery } from '@/api/shop'

type ProductListState = {
  key: string
  items: Product[]
  page: number
  hasNext: boolean
  status: 'loading' | 'done' | 'error'
  loadingMore: boolean
}

// 상점 상품 목록. 조건이 바뀌면 처음부터, 더 보기는 다음 장을 이어 붙임
export function useProductList(query: ProductQuery, enabled = true) {
  const key = JSON.stringify(query)
  const [state, setState] = useState<ProductListState | null>(null)
  const [reloadCount, setReloadCount] = useState(0)
  // 다시 받으면 올림. 그 전에 보낸 더 보기 응답은 버림
  const generation = useRef(0)

  useEffect(() => {
    if (!enabled) return
    let stale = false
    getProducts(JSON.parse(key) as ProductQuery)
      .then(({ items, hasNext }) => {
        if (!stale) setState({ key, items, page: 0, hasNext, status: 'done', loadingMore: false })
      })
      .catch(() => {
        if (!stale)
          setState({ key, items: [], page: 0, hasNext: false, status: 'error', loadingMore: false })
      })
    return () => {
      stale = true
    }
  }, [key, enabled, reloadCount])

  const current = state?.key === key ? state : null

  const loadMore = useCallback(() => {
    if (!current?.hasNext || current.loadingMore) return
    const page = current.page + 1
    const sent = generation.current
    setState({ ...current, loadingMore: true })
    getProducts(JSON.parse(key) as ProductQuery, page)
      .then(({ items, hasNext }) => {
        if (sent !== generation.current) return
        setState((prev) =>
          prev?.key === key
            ? {
                ...prev,
                // 그사이 순서가 바뀌어 겹친 상품은 한 번만
                items: [
                  ...prev.items,
                  ...items.filter((item) => !prev.items.some((p) => p.id === item.id)),
                ],
                page,
                hasNext,
                loadingMore: false,
              }
            : prev,
        )
      })
      .catch(() => {
        setState((prev) => (prev?.key === key ? { ...prev, loadingMore: false } : prev))
      })
  }, [current, key])

  const reload = useCallback(() => {
    generation.current += 1
    setReloadCount((count) => count + 1)
  }, [])

  return {
    items: current?.items ?? [],
    status: current?.status ?? 'loading',
    hasNext: !!current?.hasNext,
    loadingMore: !!current?.loadingMore,
    loadMore,
    reload,
  }
}
