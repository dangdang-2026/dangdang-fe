import { useEffect, useState, type CSSProperties } from 'react'
import type { PhotoBox } from '@/types/foodPhoto'

type PhotoBowlHeaderProps = {
  photoUrl: string
  box?: PhotoBox
  // 사진 위 번호(1부터)
  number: number
  title: string
}

// 사진 조각 크기(size-16)
const THUMB_PX = 64

// 원 숫자. 예: 2 → ②. 20 넘으면 그냥 숫자
const toCircled = (number: number) =>
  number >= 1 && number <= 20 ? String.fromCharCode(0x2460 + number - 1) : String(number)

// 그릇 영역이 조각 안에 다 들어오게 같은 비율로 줄이고 가운데 맞춤. 사진 크기 · 영역을 모르면 사진 전체
function getCropStyle(
  photoUrl: string,
  box: PhotoBox | undefined,
  size: { width: number; height: number } | null,
): CSSProperties {
  const image = `url("${photoUrl}")`
  if (!box || !size || box.width <= 0 || box.height <= 0) {
    return { backgroundImage: image, backgroundSize: 'cover', backgroundPosition: 'center' }
  }
  const scale = THUMB_PX / Math.max(box.width * size.width, box.height * size.height)
  const width = size.width * scale
  const height = size.height * scale
  return {
    backgroundImage: image,
    backgroundSize: `${width}px ${height}px`,
    backgroundPosition: `${THUMB_PX / 2 - (box.x + box.width / 2) * width}px ${
      THUMB_PX / 2 - (box.y + box.height / 2) * height
    }px`,
  }
}

// Figma F-13b · F-13c 시트 머리: 그 그릇 사진 조각 + 몇 번 그릇 + 질문
function PhotoBowlHeader({ photoUrl, box, number, title }: PhotoBowlHeaderProps) {
  // 사진 원래 크기. 비율을 알아야 조각이 늘어나지 않음
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)
  useEffect(() => {
    const image = new Image()
    image.onload = () => setSize({ width: image.naturalWidth, height: image.naturalHeight })
    image.src = photoUrl
    return () => {
      image.onload = null
    }
  }, [photoUrl])

  return (
    <div className="flex items-center gap-3">
      <div
        role="img"
        aria-label={`사진의 ${number}번 그릇`}
        className="bg-grey-100 size-16 shrink-0 rounded-xl bg-no-repeat"
        style={getCropStyle(photoUrl, box, size)}
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-body-3 text-grey-600">사진의 {toCircled(number)}번 그릇</p>
        <h2 className="text-t4 text-grey-900">{title}</h2>
      </div>
    </div>
  )
}

export default PhotoBowlHeader
