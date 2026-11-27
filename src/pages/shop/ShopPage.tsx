import { useEffect, useState, type UIEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import iconClear from '@/assets/icons/clear.svg'
import iconSearch from '@/assets/icons/search.svg'
import iconBag from '@/assets/icons/shop/bag.svg'
import iconDrink from '@/assets/icons/shop/drink.svg'
import iconLunchbox from '@/assets/icons/shop/lunchbox.svg'
import iconPick from '@/assets/icons/shop/pick.svg'
import iconSnack from '@/assets/icons/shop/snack.svg'
import MorePostsButton from '@/components/community/MorePostsButton'
import ProductCard from '@/components/shop/ProductCard'
import ProductImage from '@/components/shop/ProductImage'
import { getProducts, type Product, type ProductCategory, type ProductQuery } from '@/api/shop'
import { ROUTES } from '@/constants/routes'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useProductList } from '@/hooks/useProductList'
import { CATEGORY_LABEL, formatPrice, productPath } from '@/utils/shop'

// 홈 · 산모 PICK · 카테고리. 주소에 남겨 상품 상세에서 돌아와도 그대로
type ShopView = 'home' | 'pick' | ProductCategory

const CATEGORIES: ProductCategory[] = ['SNACK', 'LUNCHBOX', 'DRINK', 'MEAL_SWAP']

const SHORTCUTS: { view: ShopView; label: string; icon: string }[] = [
  { view: 'pick', label: '산모 PICK', icon: iconPick },
  { view: 'SNACK', label: '저당 간식', icon: iconSnack },
  { view: 'LUNCHBOX', label: '도시락', icon: iconLunchbox },
  { view: 'DRINK', label: '음료', icon: iconDrink },
]

// 배너에 보일 산모 PICK 수
const BANNER_SIZE = 5

const toView = (value: string | null): ShopView =>
  value === 'pick' || CATEGORIES.includes(value as ProductCategory) ? (value as ShopView) : 'home'

const toQuery = (view: ShopView, q: string): ProductQuery => {
  if (q) return { q }
  if (view === 'pick') return { pick: true }
  if (view === 'home') return {}
  return { category: view }
}

// 이번 주 산모 PICK을 옆으로 넘겨 보는 배너
function PickBanner({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0)
  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    const { scrollLeft, clientWidth } = event.currentTarget
    setIndex(Math.round(scrollLeft / clientWidth))
  }

  return (
    <div className="relative mx-5 mt-2.5">
      <div
        className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto"
        onScroll={onScroll}
      >
        {products.map((product) => (
          <Link
            key={product.id}
            to={productPath(product.id)}
            className="relative flex h-61 w-full shrink-0 snap-center rounded-3xl bg-yellow-50 px-5.5 pt-6.5"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 pr-4">
              <span className="text-grey-800 text-sm font-bold">이번 주 산모 PICK</span>
              <span className="text-title-2 text-grey-900 line-clamp-3">
                {product.name}
                {product.price !== null && ` ${formatPrice(product.price)}`}
              </span>
              <span className="text-grey-700 truncate text-sm">
                {[product.brand, product.sizeLabel].filter(Boolean).join(' · ')}
              </span>
            </div>
            <ProductImage
              src={product.imageUrl}
              className="h-37.5 w-29.5 shrink-0 rounded-2xl bg-white"
            />
            {product.affiliate && (
              <span className="text-grey-500 absolute bottom-5.5 left-5.5 text-xs">
                *제휴 링크 · 결제는 판매처에서
              </span>
            )}
          </Link>
        ))}
      </div>
      {products.length > 1 && (
        <span className="bg-grey-900/35 pointer-events-none absolute right-5.5 bottom-5 rounded-xl px-2.5 py-0.5 text-xs font-medium text-white">
          {index + 1} | {products.length}
        </span>
      )}
    </div>
  )
}

// 상점 메인: 검색 · 카테고리 · 산모 PICK 배너 · 상품 2열
function ShopPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const view = toView(params.get('view'))
  const [query, setQuery] = useState(params.get('q') ?? '')
  const q = useDebouncedValue(query.trim(), 300)
  const list = useProductList(toQuery(view, q))
  const [picks, setPicks] = useState<Product[]>([])

  // 검색어도 주소에 남김(상세에서 돌아와도 그대로)
  useEffect(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (q) next.set('q', q)
        else next.delete('q')
        return next
      },
      { replace: true },
    )
  }, [q, setParams])

  useEffect(() => {
    let stale = false
    getProducts({ pick: true }, 0, BANNER_SIZE)
      .then(({ items }) => {
        if (!stale) setPicks(items)
      })
      .catch(() => {})
    return () => {
      stale = true
    }
  }, [])

  const selectView = (next: ShopView) => {
    setQuery('')
    setParams(next === 'home' ? {} : { view: next }, { replace: true })
  }

  const showHome = view === 'home' && !q
  const title = q
    ? `‘${q}’ 검색 결과`
    : view === 'home'
      ? '저당 상품 모아 보기'
      : view === 'pick'
        ? '이번 주 산모 PICK'
        : null

  return (
    <main className="min-h-dvh bg-white">
      <header className="flex items-center gap-3.5 px-5 py-2">
        <label className="bg-grey-50 rounded-key flex h-11.5 min-w-0 flex-1 items-center gap-2 px-3.5">
          <img src={iconSearch} alt="" width={20} height={20} />
          <input
            type="search"
            aria-label="상품 검색"
            placeholder="저당 간식 검색하기"
            value={query}
            maxLength={100}
            className="text-grey-900 placeholder:text-grey-500 min-w-0 flex-1 bg-transparent text-base outline-none [&::-webkit-search-cancel-button]:hidden"
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button type="button" aria-label="검색어 지우기" onClick={() => setQuery('')}>
              <img src={iconClear} alt="" width={18} height={18} />
            </button>
          )}
        </label>
        <button type="button" aria-label="찜한 상품" onClick={() => navigate(ROUTES.MY_LIKED)}>
          <img src={iconBag} alt="" width={26} height={26} />
        </button>
      </header>

      <nav
        aria-label="상품 종류"
        className="flex [scrollbar-width:none] gap-0.5 overflow-x-auto pt-2.5 pr-5 pb-1.5 pl-3.5"
      >
        {(['home', ...CATEGORIES] as ShopView[]).map((key) => {
          const active = !q && view === key
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-base ${
                active ? 'bg-grey-50 text-grey-900 font-bold' : 'text-grey-700 font-medium'
              }`}
              onClick={() => selectView(key)}
            >
              {key === 'home' ? '홈' : CATEGORY_LABEL[key as ProductCategory]}
            </button>
          )
        })}
      </nav>

      {showHome && (
        <>
          {picks.length > 0 && <PickBanner products={picks} />}
          <nav aria-label="바로가기" className="flex justify-between px-5 pt-5.5">
            {SHORTCUTS.map((shortcut) => (
              <button
                key={shortcut.view}
                type="button"
                className="text-body-3 text-grey-900 flex w-14 flex-col items-center gap-2"
                onClick={() => selectView(shortcut.view)}
              >
                <span className="bg-grey-50 flex h-7 w-14 items-center justify-center rounded-full">
                  <img src={shortcut.icon} alt="" width={28} height={28} />
                </span>
                {shortcut.label}
              </button>
            ))}
          </nav>
        </>
      )}

      {title && (
        <div className="flex items-center gap-1.5 px-5 pt-7.5 pb-3">
          <h2 className="text-t4 text-grey-900 min-w-0 flex-1 truncate">{title}</h2>
          {/* 상점 상품은 제휴 링크라 늘 표시 */}
          <span className="border-grey-200 text-grey-700 rounded-md border px-1.5 py-0.5 text-xs font-medium">
            제휴
          </span>
        </div>
      )}

      <section className={`px-5 pb-10 ${title ? '' : 'pt-4'}`}>
        {list.status === 'loading' ? (
          <p className="text-body-3 text-grey-500 py-16 text-center">불러오는 중…</p>
        ) : list.status === 'error' ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <p className="text-body-3 text-grey-500">상품을 불러오지 못했어요</p>
            <button
              type="button"
              className="text-t7 border-grey-200 text-grey-700 rounded-full border px-4 py-2 font-medium"
              onClick={list.reload}
            >
              다시 불러오기
            </button>
          </div>
        ) : list.items.length === 0 ? (
          <p className="text-body-3 text-grey-500 py-16 text-center">
            {q ? '찾는 상품이 없어요' : '아직 준비 중인 상품이에요'}
          </p>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-x-2.5 gap-y-6">
              {list.items.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
            {list.hasNext && (
              <MorePostsButton
                loading={list.loadingMore}
                label="상품 더 보기"
                onClick={list.loadMore}
              />
            )}
          </>
        )}
      </section>
    </main>
  )
}

export default ShopPage
