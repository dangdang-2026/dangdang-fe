import type { PhotoBox } from '@/types/foodPhoto'

type PhotoBowlHeaderProps = {
  photoUrl: string
  box?: PhotoBox
  // 사진 위 번호(1부터)
  number: number
  title: string
}

// 원 숫자. 예: 2 → ②. 20 넘으면 그냥 숫자
const toCircled = (number: number) =>
  number >= 1 && number <= 20 ? String.fromCharCode(0x2460 + number - 1) : String(number)

// 그릇 영역만 보이게 배경 크기 · 위치를 맞춤. 영역을 모르면 사진 전체
function getCropStyle(photoUrl: string, box?: PhotoBox) {
  const style = { backgroundImage: `url("${photoUrl}")` }
  if (!box || box.width <= 0 || box.height <= 0) {
    return { ...style, backgroundSize: 'cover', backgroundPosition: 'center' }
  }
  const position = (start: number, size: number) => (size >= 1 ? 0 : (start / (1 - size)) * 100)
  return {
    ...style,
    backgroundSize: `${100 / box.width}% ${100 / box.height}%`,
    backgroundPosition: `${position(box.x, box.width)}% ${position(box.y, box.height)}%`,
  }
}

// Figma F-13b · F-13c 시트 머리: 그 그릇 사진 조각 + 몇 번 그릇 + 질문
function PhotoBowlHeader({ photoUrl, box, number, title }: PhotoBowlHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        role="img"
        aria-label={`사진의 ${number}번 그릇`}
        className="size-16 shrink-0 rounded-xl bg-no-repeat"
        style={getCropStyle(photoUrl, box)}
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-body-3 text-grey-600">사진의 {toCircled(number)}번 그릇</p>
        <h2 className="text-t4 text-grey-900">{title}</h2>
      </div>
    </div>
  )
}

export default PhotoBowlHeader
