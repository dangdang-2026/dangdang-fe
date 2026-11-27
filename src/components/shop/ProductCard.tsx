import { Link } from 'react-router'
import iconHeartFilled from '@/assets/icons/shop/heart-filled.svg'
import iconHeart from '@/assets/icons/shop/heart.svg'
import type { Product } from '@/api/shop'
import ProductImage from '@/components/shop/ProductImage'
import { formatPrice, productPath } from '@/utils/shop'

type ProductCardProps = {
  product: Product
  // 찜한 상품 화면처럼 사진 위 하트로 바로 찜 빼기
  onToggleLike?: () => void
}

// 상품 2열 카드: 사진 · 브랜드 · 이름 · 가격
function ProductCard({ product, onToggleLike }: ProductCardProps) {
  const to = productPath(product.id)
  return (
    <div className="flex flex-col">
      <div className="relative">
        <Link to={to} tabIndex={-1} aria-hidden>
          <ProductImage src={product.imageUrl} className="bg-grey-100 aspect-square rounded-2xl" />
        </Link>
        {onToggleLike && (
          <button
            type="button"
            aria-label={product.liked ? '찜 빼기' : '찜하기'}
            aria-pressed={product.liked}
            className="absolute right-2.5 bottom-2.5"
            onClick={onToggleLike}
          >
            <img src={product.liked ? iconHeartFilled : iconHeart} alt="" width={24} height={24} />
          </button>
        )}
      </div>
      <Link to={to} className="mt-2.5 flex flex-col gap-1">
        <span className="text-grey-700 text-xs">{product.brand}</span>
        <span className="text-body-2 text-grey-900 line-clamp-2">{product.name}</span>
        {product.price !== null && (
          <span className="text-grey-900 text-base font-bold">{formatPrice(product.price)}</span>
        )}
      </Link>
    </div>
  )
}

export default ProductCard
