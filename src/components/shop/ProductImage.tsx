// 사진 자리. 사진이 없으면 배경색 상자(배경색은 className으로)
function ProductImage({ src, className }: { src: string | null; className: string }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      {src && <img src={src} alt="" className="size-full object-cover" />}
    </div>
  )
}

export default ProductImage
