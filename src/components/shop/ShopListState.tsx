import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ROUTES } from '@/constants/routes'

type ShopListStateProps = {
  status: 'loading' | 'done' | 'error'
  empty: boolean
  emptyText: string
  onRetry: () => void
  children: ReactNode
}

// 내 쇼핑 목록 공통: 불러오는 중 · 실패 · 비었을 때(상점 가기)
function ShopListState({ status, empty, emptyText, onRetry, children }: ShopListStateProps) {
  const navigate = useNavigate()
  if (status === 'loading')
    return <p className="text-body-3 text-grey-500 py-24 text-center">불러오는 중…</p>
  if (status === 'error' || empty)
    return (
      <div className="flex flex-col items-center gap-3 py-24">
        <p className="text-body-3 text-grey-500">
          {status === 'error' ? '불러오지 못했어요' : emptyText}
        </p>
        <button
          type="button"
          className="text-t7 border-grey-200 text-grey-700 rounded-full border px-4 py-2 font-medium"
          onClick={status === 'error' ? onRetry : () => navigate(ROUTES.SHOP)}
        >
          {status === 'error' ? '다시 불러오기' : '상점 둘러보기'}
        </button>
      </div>
    )
  return children
}

export default ShopListState
