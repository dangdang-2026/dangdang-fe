import type { ProductCategory } from '@/api/shop'
import { ROUTES } from '@/constants/routes'

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  SNACK: '간식',
  LUNCHBOX: '도시락',
  DRINK: '음료',
  MEAL_SWAP: '밥·면 대신',
}

// 예: 9,800원
export function formatPrice(price: number) {
  return `${price.toLocaleString('ko-KR')}원`
}

// 예: 탄수 5g · 당 4g · 단백질 10g · 90kcal. 모르는 칸은 뺌
export function formatNutrition(nutrition: {
  carbG: number | null
  sugarG: number | null
  proteinG: number | null
  kcal: number | null
}) {
  const parts = [
    nutrition.carbG !== null && `탄수 ${nutrition.carbG}g`,
    nutrition.sugarG !== null && `당 ${nutrition.sugarG}g`,
    nutrition.proteinG !== null && `단백질 ${nutrition.proteinG}g`,
    nutrition.kcal !== null && `${nutrition.kcal}kcal`,
  ]
  return parts.filter(Boolean).join(' · ')
}

// 판매처 이동 안내를 다시 보일 시각
const OUTBOUND_HIDE_KEY = 'dangdang-shop-outbound-hide'
const HIDE_MS = 7 * 24 * 60 * 60 * 1000

export function isOutboundNoticeHidden() {
  try {
    return Number(localStorage.getItem(OUTBOUND_HIDE_KEY) ?? 0) > Date.now()
  } catch {
    return false
  }
}

export function hideOutboundNotice() {
  try {
    localStorage.setItem(OUTBOUND_HIDE_KEY, String(Date.now() + HIDE_MS))
  } catch {
    // 저장소를 못 쓰면 다음에도 안내
  }
}

// 판매처 주소는 서버 응답 뒤에 와서, 누른 순간 빈 창을 먼저 열어야 팝업 차단을 피함
export async function openSellerPage(getUrl: () => Promise<string>) {
  const popup = window.open('', '_blank')
  try {
    const url = await getUrl()
    // 서버 데이터가 잘못돼도 웹 주소(https · http)만 엶. javascript: 같은 건 앱 권한으로 돌 수 있음
    if (!['https:', 'http:'].includes(new URL(url).protocol))
      throw new Error('판매처 주소가 웹 주소가 아님')
    if (popup) {
      popup.opener = null
      popup.location.href = url
    } else {
      window.location.href = url
    }
  } catch (error) {
    popup?.close()
    throw error
  }
}

export const productPath = (id: string) => ROUTES.SHOP_PRODUCT.replace(':id', id)
