import { useCallback, useEffect, useState, type UIEvent } from 'react'
import { useParams } from 'react-router'
// 사진 위라 기본 회색 뒤로 대신 진한 색
import iconBack from '@/assets/icons/shop/back-dark.svg'
import iconHeartFilled from '@/assets/icons/shop/heart-filled.svg'
import iconHeart from '@/assets/icons/shop/heart.svg'
import iconShare from '@/assets/icons/shop/share.svg'
import Toast from '@/components/common/Toast'
import OutboundNotice from '@/components/shop/OutboundNotice'
import ProductImage from '@/components/shop/ProductImage'
import { getErrorCode } from '@/api/axios'
import { getProduct, setProductLiked, visitProduct, type ProductDetail } from '@/api/shop'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import {
  formatNutrition,
  formatPrice,
  hideOutboundNotice,
  isOutboundNoticeHidden,
  openSellerPage,
} from '@/utils/shop'

type LoadState = { id: string; product: ProductDetail } | { id: string; error: 'gone' | 'fail' }

// 상품 사진을 옆으로 넘겨 봄. 없으면 회색 상자 하나
function PhotoSlider({ urls }: { urls: string[] }) {
  const [index, setIndex] = useState(0)
  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    const { scrollLeft, clientWidth } = event.currentTarget
    setIndex(Math.round(scrollLeft / clientWidth))
  }
  const photos = urls.length > 0 ? urls : [null]

  return (
    // 피그마처럼 사진이 상태 바 뒤까지(높이 420px은 상태 바 포함)
    <div className="relative -mt-[env(safe-area-inset-top)]">
      <div
        className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto"
        onScroll={onScroll}
      >
        {photos.map((url, i) => (
          <ProductImage
            key={i}
            src={url}
            className="bg-grey-100 h-105 w-full shrink-0 snap-center"
          />
        ))}
      </div>
      {photos.length > 1 && (
        <span className="text-grey-700 pointer-events-none absolute right-4 bottom-4 rounded-xl bg-white/85 px-2.5 py-0.5 text-xs font-medium">
          {index + 1} | {photos.length}
        </span>
      )}
    </div>
  )
}

// 상품 상세: 사진 · 가격 · 영양 · 찜 · 구매하기(판매처로 이동)
function ProductDetailPage() {
  const { id = '' } = useParams()
  const goBack = useGoBack(ROUTES.SHOP)
  const [state, setState] = useState<LoadState | null>(null)
  const [reloadCount, setReloadCount] = useState(0)
  const [liked, setLiked] = useState<boolean | null>(null)
  const [likePending, setLikePending] = useState(false)
  const [notice, setNotice] = useState(false)
  const [visiting, setVisiting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])

  useEffect(() => {
    let stale = false
    getProduct(id)
      .then((product) => {
        if (stale) return
        setState({ id, product })
        setLiked(product.liked)
      })
      .catch((error: unknown) => {
        if (!stale) setState({ id, error: getErrorCode(error) === 'SHOP_40401' ? 'gone' : 'fail' })
      })
    return () => {
      stale = true
    }
  }, [id, reloadCount])

  const current = state?.id === id ? state : null
  const product = current && 'product' in current ? current.product : null

  const toggleLike = () => {
    if (!product || likePending || liked === null) return
    const next = !liked
    setLiked(next)
    setLikePending(true)
    setProductLiked(product.id, next)
      .then(() => setToast(next ? '찜한 상품에 담았어요' : '찜을 뺐어요'))
      .catch((error: unknown) => {
        setLiked(!next)
        setToast(
          getErrorCode(error) === 'SHOP_40401'
            ? '판매가 끝난 상품이에요'
            : '찜하지 못했어요. 잠시 후 다시 시도해 주세요',
        )
      })
      .finally(() => setLikePending(false))
  }

  // 공유 시트가 없는 브라우저는 링크 복사
  const share = async () => {
    if (!product) return
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: product.name, url }).catch(() => {})
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setToast('링크를 복사했어요')
    } catch {
      setToast('링크를 복사하지 못했어요')
    }
  }

  const goSeller = (hide: boolean) => {
    if (!product || visiting) return
    setVisiting(true)
    openSellerPage(() => visitProduct(product.id))
      .then(() => {
        // 7일 동안 보지 않기는 판매처로 간 뒤에만 남김
        if (hide) hideOutboundNotice()
        setNotice(false)
      })
      .catch((error: unknown) => {
        if (getErrorCode(error) === 'SHOP_40401') {
          setNotice(false)
          setState({ id: product.id, error: 'gone' })
          return
        }
        setToast('판매처로 가지 못했어요. 잠시 후 다시 시도해 주세요')
      })
      .finally(() => setVisiting(false))
  }

  const buy = () => {
    if (isOutboundNoticeHidden()) goSeller(false)
    else {
      // 찜 안내가 떠 있으면 안내 버튼을 가려서 닫음
      setToast(null)
      setNotice(true)
    }
  }

  const header = (
    <header className="absolute inset-x-0 top-2 z-10 flex h-11 items-center justify-between pr-5 pl-4">
      <button type="button" aria-label="뒤로" onClick={goBack}>
        <img src={iconBack} alt="" width={26} height={26} />
      </button>
      {product && (
        <button type="button" aria-label="공유" onClick={() => void share()}>
          <img src={iconShare} alt="" width={24} height={24} />
        </button>
      )}
    </header>
  )

  if (!product) {
    return (
      <main className="relative mx-auto min-h-dvh max-w-107.5 bg-white pt-14">
        {header}
        {current && 'error' in current ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <p className="text-body-3 text-grey-500">
              {current.error === 'gone'
                ? '판매가 끝났거나 없는 상품이에요'
                : '상품을 불러오지 못했어요'}
            </p>
            {current.error === 'fail' && (
              <button
                type="button"
                className="text-t7 border-grey-200 text-grey-700 rounded-full border px-4 py-2 font-medium"
                onClick={() => setReloadCount((count) => count + 1)}
              >
                다시 불러오기
              </button>
            )}
          </div>
        ) : (
          <p className="text-body-3 text-grey-500 py-24 text-center">불러오는 중…</p>
        )}
      </main>
    )
  }

  const priceNote = [
    product.pricePer100 !== null &&
      product.contentUnit &&
      `100${product.contentUnit}당 ${formatPrice(product.pricePer100)}`,
    product.shippingNote,
  ]
    .filter(Boolean)
    .join(' · ')
  const nutrition = product.nutrition && formatNutrition(product.nutrition)

  return (
    // 아래 버튼(96px)에 가리지 않게 여백
    <main className="relative mx-auto min-h-dvh max-w-107.5 bg-white pb-28">
      {header}
      <PhotoSlider urls={product.imageUrls} />

      <section className="flex flex-col gap-2.5 px-5 pt-5">
        {(product.pick || product.affiliate) && (
          <div className="flex gap-1.5">
            {product.pick && (
              <span className="text-body-3 text-grey-800 rounded-md bg-yellow-50 px-2 py-1 font-bold">
                산모 PICK
              </span>
            )}
            {product.affiliate && (
              <span className="text-body-3 border-grey-200 text-grey-700 rounded-md border px-2 py-1">
                제휴
              </span>
            )}
          </div>
        )}
        <h1 className="text-grey-900 text-xl font-medium">{product.name}</h1>
        <p className="text-grey-700 text-sm">
          {[product.brand, product.sellerName && `판매처 ${product.sellerName}`]
            .filter(Boolean)
            .join(' · ')}
        </p>

        {product.price !== null && (
          <div className="bg-grey-50 flex flex-col gap-1 rounded-2xl px-4.5 py-4">
            <span className="text-body-3 text-grey-700">판매처 가격</span>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-t2 text-grey-900">{formatPrice(product.price)}</span>
              {priceNote && <span className="text-t7 text-grey-700">{priceNote}</span>}
            </div>
            <span className="text-grey-500 text-xs">
              가격·배송은 판매처 기준이라 바뀔 수 있어요
            </span>
          </div>
        )}

        {nutrition && (
          <dl className="flex gap-3 pt-2 text-sm">
            <dt className="text-grey-700 w-18 shrink-0">
              영양{product.nutrition?.servingLabel && ` (${product.nutrition.servingLabel})`}
            </dt>
            <dd className="text-grey-900 font-medium">{nutrition}</dd>
          </dl>
        )}
      </section>

      <div className="shadow-buy-bar fixed bottom-0 left-1/2 z-40 flex w-full max-w-107.5 -translate-x-1/2 items-center gap-2.5 bg-white px-4 pt-2.5 pb-[max(--spacing(7.5),env(safe-area-inset-bottom))]">
        <button
          type="button"
          aria-label={liked ? '찜 빼기' : '찜하기'}
          aria-pressed={!!liked}
          disabled={likePending}
          className="px-1.5"
          onClick={toggleLike}
        >
          <img src={liked ? iconHeartFilled : iconHeart} alt="" width={28} height={28} />
        </button>
        <button
          type="button"
          disabled={visiting}
          className="bg-primary text-subtitle-1 rounded-key h-14 flex-1 text-white disabled:opacity-60"
          onClick={buy}
        >
          구매하기
        </button>
      </div>

      {notice && (
        <OutboundNotice
          sellerName={product.sellerName}
          pending={visiting}
          onGo={goSeller}
          onClose={(hide) => {
            if (hide) hideOutboundNotice()
            setNotice(false)
          }}
        />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default ProductDetailPage
