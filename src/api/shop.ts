import { apiClient, type BaseResponse } from '@/api/axios'

// 백엔드 ProductCategory
export type ProductCategory = 'SNACK' | 'LUNCHBOX' | 'DRINK' | 'MEAL_SWAP'

// 백엔드 ProductSummaryResponse. 상품 카드 하나
type ProductSummaryResponse = {
  id: number
  category: ProductCategory
  brand: string
  name: string
  sizeLabel: string | null
  price: number | null
  imageUrl: string | null
  pick: boolean
  affiliate: boolean
  liked: boolean
}

// 백엔드 ProductDetailResponse. 판매처 주소는 안 줌(이동 기록 API로 받음)
type ProductDetailResponse = Omit<ProductSummaryResponse, 'imageUrl'> & {
  pricePer100: number | null
  contentUnit: string | null
  shippingNote: string | null
  nutrition: {
    servingLabel: string | null
    carbG: number | null
    sugarG: number | null
    proteinG: number | null
    kcal: number | null
  } | null
  imageUrls: string[]
  sellerName: string | null
}

export type Product = Omit<ProductSummaryResponse, 'id'> & { id: string }

export type ProductDetail = Omit<ProductDetailResponse, 'id'> & { id: string }

const toProduct = (item: ProductSummaryResponse): Product => ({ ...item, id: String(item.id) })

// 한 장에 받을 개수(서버 상한 50)
const PAGE_SIZE = 20

export type ProductQuery = {
  category?: ProductCategory
  // 이번 주 산모 PICK만
  pick?: boolean
  q?: string
}

// 상점 상품 목록. 판매 중인 것만, 운영자가 정한 순서
export async function getProducts(query: ProductQuery, page = 0, size = PAGE_SIZE) {
  const { data } = await apiClient.get<
    BaseResponse<{ items: ProductSummaryResponse[]; hasNext: boolean }>
  >('/products', {
    params: { category: query.category, pick: query.pick || undefined, q: query.q, page, size },
  })
  if (!data.data) throw new Error('상품 목록 응답이 비어 있음')
  return { items: data.data.items.map(toProduct), hasNext: data.data.hasNext }
}

// 상품 상세. 열면 서버가 최근 본 상품에 남김. 없거나 판매 끝난 상품은 SHOP_40401
export async function getProduct(id: string): Promise<ProductDetail> {
  const { data } = await apiClient.get<BaseResponse<ProductDetailResponse>>(`/products/${id}`)
  if (!data.data) throw new Error('상품 상세 응답이 비어 있음')
  return { ...data.data, id: String(data.data.id) }
}

// 찜하기 · 빼기. 이미 그 상태여도 200
export async function setProductLiked(id: string, liked: boolean) {
  if (liked) await apiClient.put(`/products/${id}/like`)
  else await apiClient.delete(`/products/${id}/like`)
}

// 판매처로 이동 기록을 남기고 판매처 주소를 받음
export async function visitProduct(id: string) {
  const { data } = await apiClient.post<BaseResponse<{ url: string }>>(`/products/${id}/visits`)
  if (!data.data?.url) throw new Error('판매처 주소 응답이 비어 있음')
  return data.data.url
}

// 커서로 받는 내 쇼핑 목록 한 장
type CursorPage<T> = { items: T[]; nextCursor: string | null; hasNext: boolean }

const nextCursorOf = (page: { nextCursor: string | null; hasNext?: boolean }) =>
  page.hasNext === false ? null : page.nextCursor

// 찜한 상품. totalCount는 판매 중인 찜 전체 수
export async function getLikedProducts(cursor?: string) {
  const { data } = await apiClient.get<
    BaseResponse<{ items: ProductSummaryResponse[]; nextCursor: string | null; totalCount: number }>
  >('/me/liked-products', { params: { cursor, size: PAGE_SIZE } })
  if (!data.data) throw new Error('찜한 상품 응답이 비어 있음')
  return {
    items: data.data.items.map(toProduct),
    nextCursor: nextCursorOf(data.data),
    totalCount: data.data.totalCount,
  }
}

// 최근 본 상품. 최근 7일, 마지막으로 본 순
export async function getRecentProducts(cursor?: string) {
  const { data } = await apiClient.get<
    BaseResponse<CursorPage<{ product: ProductSummaryResponse; viewedAt: string }>>
  >('/me/recent-products', { params: { cursor, size: PAGE_SIZE } })
  if (!data.data) throw new Error('최근 본 상품 응답이 비어 있음')
  return {
    items: data.data.items.map((item) => ({ ...toProduct(item.product), viewedAt: item.viewedAt })),
    nextCursor: nextCursorOf(data.data),
  }
}

// 최근 본 상품 하나 · 모두 지우기. 없어도 200
export async function removeRecentProduct(id: string) {
  await apiClient.delete(`/me/recent-products/${id}`)
}

export async function clearRecentProducts() {
  await apiClient.delete('/me/recent-products')
}

// 백엔드 ProductVisitResponse. 가격 · 판매처는 갔을 때 값
type ProductVisitResponse = {
  id: number
  productId: number
  name: string
  imageUrl: string | null
  price: number | null
  sellerName: string | null
  visitedAt: string
  // 판매가 끝났으면 「다시 가기」 대신 「판매 끝남」
  available: boolean
}

export type ProductVisit = Omit<ProductVisitResponse, 'id' | 'productId'> & {
  id: string
  productId: string
}

// 판매처로 간 기록. 최근 간 순
export async function getProductVisits(cursor?: string) {
  const { data } = await apiClient.get<BaseResponse<CursorPage<ProductVisitResponse>>>(
    '/me/product-visits',
    { params: { cursor, size: PAGE_SIZE } },
  )
  if (!data.data) throw new Error('판매처로 간 기록 응답이 비어 있음')
  return {
    items: data.data.items.map((item): ProductVisit => ({
      ...item,
      id: String(item.id),
      productId: String(item.productId),
    })),
    nextCursor: nextCursorOf(data.data),
  }
}

// 판매처로 간 기록 모두 지우기
export async function clearProductVisits() {
  await apiClient.delete('/me/product-visits')
}

// 마이 › 쇼핑 메뉴 숫자. 둘 다 판매 중인 것만, 최근 본 건 최근 7일
export async function getShoppingSummary() {
  const { data } =
    await apiClient.get<BaseResponse<{ likedCount: number; recentCount: number }>>(
      '/me/shopping-summary',
    )
  if (!data.data) throw new Error('쇼핑 요약 응답이 비어 있음')
  return data.data
}
