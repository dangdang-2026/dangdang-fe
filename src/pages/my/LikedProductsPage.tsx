import { useCallback, useState } from 'react'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import MorePostsButton from '@/components/community/MorePostsButton'
import ProductCard from '@/components/shop/ProductCard'
import ShopListState from '@/components/shop/ShopListState'
import { getLikedProducts, setProductLiked, type Product } from '@/api/shop'
import { ROUTES } from '@/constants/routes'
import { useCursorList } from '@/hooks/useCursorList'
import { useGoBack } from '@/hooks/useGoBack'

// 찜한 상품. 하트를 눌러 빼도 화면을 나갈 때까지는 남겨 둬 바로 다시 찜할 수 있음
function LikedProductsPage() {
  const goBack = useGoBack(ROUTES.MY)
  const [total, setTotal] = useState<number | null>(null)
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  const list = useCursorList(getLikedProducts, (page) => setTotal(page.totalCount))

  const toggleLike = (product: Product) => {
    if (pending.has(product.id)) return
    const next = !product.liked
    const apply = (liked: boolean) => {
      list.setItems((items) =>
        items.map((item) => (item.id === product.id ? { ...item, liked } : item)),
      )
      setTotal((count) => (count === null ? count : count + (liked ? 1 : -1)))
    }
    apply(next)
    setPending((prev) => new Set(prev).add(product.id))
    setProductLiked(product.id, next)
      .catch(() => {
        apply(!next)
        setToast('찜을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요')
      })
      .finally(() =>
        setPending((prev) => {
          const rest = new Set(prev)
          rest.delete(product.id)
          return rest
        }),
      )
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-2 pb-10">
      <SubPageHeader title="찜한 상품" onBack={goBack} />
      <ShopListState
        status={list.status}
        empty={list.items.length === 0}
        emptyText="아직 찜한 상품이 없어요"
        onRetry={list.reload}
      >
        {total !== null && <p className="text-grey-700 py-3 text-sm font-medium">{total}개</p>}
        <ul className="grid grid-cols-2 gap-x-2.5 gap-y-6">
          {list.items.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} onToggleLike={() => toggleLike(product)} />
            </li>
          ))}
        </ul>
        {list.hasNext && (
          <MorePostsButton loading={list.loadingMore} label="더 보기" onClick={list.loadMore} />
        )}
        <p className="text-body-3 text-grey-500 py-6 font-normal">
          가격은 판매처 기준이라 찜한 뒤에 바뀔 수 있어요.
        </p>
      </ShopListState>
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default LikedProductsPage
