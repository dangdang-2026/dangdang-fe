import { useCallback, useState } from 'react'
import ConfirmSheet from '@/components/common/ConfirmSheet'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import MorePostsButton from '@/components/community/MorePostsButton'
import ProductCard from '@/components/shop/ProductCard'
import ShopListState from '@/components/shop/ShopListState'
import { clearRecentProducts, getRecentProducts, removeRecentProduct } from '@/api/shop'
import { ROUTES } from '@/constants/routes'
import { useCursorList } from '@/hooks/useCursorList'
import { useGoBack } from '@/hooks/useGoBack'

// 최근 본 상품. 디자인이 없어 찜한 상품과 같은 2열, 사진 위 X로 하나씩 지움
function RecentProductsPage() {
  const goBack = useGoBack(ROUTES.MY)
  const list = useCursorList(getRecentProducts)
  const [confirming, setConfirming] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])

  const remove = (id: string) => {
    const index = list.items.findIndex((item) => item.id === id)
    const removed = list.items[index]
    if (!removed) return
    list.setItems((items) => items.filter((item) => item.id !== id))
    removeRecentProduct(id).catch(() => {
      // 그사이 지운 다른 상품은 그대로, 실패한 것만 원래 자리에
      list.setItems((items) =>
        items.some((item) => item.id === id)
          ? items
          : [...items.slice(0, index), removed, ...items.slice(index)],
      )
      setToast('지우지 못했어요. 잠시 후 다시 시도해 주세요')
    })
  }

  const clearAll = () => {
    setClearing(true)
    clearRecentProducts()
      .then(() => {
        list.setItems(() => [])
        list.reload()
        setToast('최근 본 상품을 모두 지웠어요')
      })
      .catch(() => setToast('지우지 못했어요. 잠시 후 다시 시도해 주세요'))
      .finally(() => {
        setClearing(false)
        setConfirming(false)
      })
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-2 pb-10">
      <SubPageHeader title="최근 본 상품" onBack={goBack} />
      <ShopListState
        status={list.status}
        empty={list.items.length === 0}
        emptyText="최근 7일 동안 본 상품이 없어요"
        onRetry={list.reload}
      >
        <p className="text-grey-700 py-3 text-sm font-medium">최근 7일</p>
        <ul className="grid grid-cols-2 gap-x-2.5 gap-y-6">
          {list.items.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} onRemove={() => remove(product.id)} />
            </li>
          ))}
        </ul>
        {list.hasNext && (
          <MorePostsButton loading={list.loadingMore} label="더 보기" onClick={list.loadMore} />
        )}
        <button
          type="button"
          className="text-body-3 text-grey-500 mx-auto block py-6"
          onClick={() => setConfirming(true)}
        >
          모두 지우기
        </button>
      </ShopListState>
      {confirming && (
        <ConfirmSheet
          title="최근 본 상품을 모두 지울까요?"
          confirmLabel="모두 지우기"
          danger
          loading={clearing}
          onConfirm={clearAll}
          onClose={() => setConfirming(false)}
        />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default RecentProductsPage
