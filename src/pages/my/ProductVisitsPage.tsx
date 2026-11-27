import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import ConfirmSheet from '@/components/common/ConfirmSheet'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import MorePostsButton from '@/components/community/MorePostsButton'
import ProductImage from '@/components/shop/ProductImage'
import ShopListState from '@/components/shop/ShopListState'
import { getErrorCode } from '@/api/axios'
import { clearProductVisits, getProductVisits, visitProduct, type ProductVisit } from '@/api/shop'
import { ROUTES } from '@/constants/routes'
import { useCursorList } from '@/hooks/useCursorList'
import { useGoBack } from '@/hooks/useGoBack'
import { formatMeridiemTime, formatMonthDay, isSameDay } from '@/utils/date'
import { formatPrice, openSellerPage, productPath } from '@/utils/shop'

// 간 날(기기 날짜)로 묶음. 목록이 최근 순이라 순서 그대로
function groupByDay(visits: ProductVisit[]) {
  const groups: { day: Date; visits: ProductVisit[] }[] = []
  visits.forEach((visit) => {
    const at = new Date(visit.visitedAt)
    const last = groups.at(-1)
    if (last && isSameDay(last.day, at)) last.visits.push(visit)
    else groups.push({ day: at, visits: [visit] })
  })
  return groups
}

// 판매처로 간 기록. 주문 내역은 알 수 없어 간 기록만
function ProductVisitsPage() {
  const goBack = useGoBack(ROUTES.MY)
  const list = useCursorList(getProductVisits)
  const [visiting, setVisiting] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  const today = new Date()

  // 다시 가기도 서버에 새 이동 기록을 남겨서 다녀온 뒤 목록을 새로 받음
  const goAgain = (visit: ProductVisit) => {
    if (visiting) return
    setVisiting(visit.id)
    openSellerPage(() => visitProduct(visit.productId))
      // 서버는 새 이동 기록을 한 줄 더 만듦. 받아 둔 장은 그대로 두고 맨 위에만 붙임
      .then(() =>
        list.setItems((items) => [
          { ...visit, id: `again-${Date.now()}`, visitedAt: new Date().toISOString() },
          ...items,
        ]),
      )
      .catch((error: unknown) => {
        if (getErrorCode(error) === 'SHOP_40401') {
          list.setItems((items) =>
            items.map((item) =>
              item.productId === visit.productId ? { ...item, available: false } : item,
            ),
          )
          setToast('판매가 끝난 상품이에요')
        } else setToast('판매처로 가지 못했어요. 잠시 후 다시 시도해 주세요')
      })
      .finally(() => setVisiting(null))
  }

  const clearAll = () => {
    setClearing(true)
    clearProductVisits()
      .then(() => {
        list.setItems(() => [])
        list.reload()
        setToast('판매처로 간 기록을 모두 지웠어요')
      })
      .catch(() => setToast('지우지 못했어요. 잠시 후 다시 시도해 주세요'))
      .finally(() => {
        setClearing(false)
        setConfirming(false)
      })
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-2 pb-10">
      <SubPageHeader title="판매처로 간 기록" onBack={goBack} />
      <p className="text-t7 text-grey-700 bg-grey-50 mt-2 rounded-xl px-3.5 py-3">
        당당은 주문 내역을 알 수 없어요.
        <br />
        결제 · 배송 · 환불은 판매처 앱이나 사이트에서 확인해 주세요.
      </p>
      <ShopListState
        status={list.status}
        empty={list.items.length === 0}
        emptyText="아직 판매처로 간 기록이 없어요"
        onRetry={list.reload}
      >
        {groupByDay(list.items).map(({ day, visits }) => (
          <section key={day.toDateString()}>
            <h2 className="text-grey-700 pt-4.5 pb-3 text-sm font-bold">
              {isSameDay(day, today) ? '오늘' : formatMonthDay(day)}
            </h2>
            <ul>
              {visits.map((visit) => (
                <li key={visit.id} className="flex items-center gap-3.5 py-2.5">
                  <Link
                    to={productPath(visit.productId)}
                    className="flex min-w-0 flex-1 items-center gap-3.5"
                  >
                    <ProductImage
                      src={visit.imageUrl}
                      className="bg-grey-100 size-14 shrink-0 rounded-xl"
                    />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-body-2 text-grey-900 truncate">{visit.name}</span>
                      <span className="text-grey-500 truncate text-xs">
                        {[visit.sellerName, `${formatMeridiemTime(new Date(visit.visitedAt))} 이동`]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                      {visit.price !== null && (
                        <span className="text-grey-900 text-sm font-bold">
                          {formatPrice(visit.price)}
                        </span>
                      )}
                    </span>
                  </Link>
                  {visit.available ? (
                    <button
                      type="button"
                      disabled={visiting !== null}
                      className="text-body-3 text-grey-900 bg-grey-50 shrink-0 rounded-lg px-3 py-1.5 font-bold"
                      onClick={() => goAgain(visit)}
                    >
                      다시 가기
                    </button>
                  ) : (
                    <span className="text-body-3 text-grey-400 shrink-0 px-3 py-1.5">
                      판매 끝남
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
        {list.hasNext && (
          <MorePostsButton loading={list.loadingMore} label="더 보기" onClick={list.loadMore} />
        )}
        <button
          type="button"
          className="text-body-3 text-grey-500 mx-auto block py-6"
          onClick={() => setConfirming(true)}
        >
          기록 모두 지우기
        </button>
      </ShopListState>
      {confirming && (
        <ConfirmSheet
          title="판매처로 간 기록을 모두 지울까요?"
          description="판매처의 주문 내역은 지워지지 않아요."
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

export default ProductVisitsPage
