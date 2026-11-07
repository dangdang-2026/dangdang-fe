import { formatTime } from '@/utils/date'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
// Figma F-10b 스탬프 글자색·그림자
const STAMP_BRAND = '#fab214'
const STAMP_SHADOW = 'rgba(0, 0, 0, 0.45)'

// 예: 2026.10.22 (목) · 점심
export function formatStampDate(at: Date, mealLabel: string) {
  const date = `${at.getFullYear()}.${String(at.getMonth() + 1).padStart(2, '0')}.${String(
    at.getDate(),
  ).padStart(2, '0')}`
  return `${date} (${WEEKDAYS[at.getDay()]}) · ${mealLabel}`
}

// 찍은 사진 왼쪽 아래에 시각 · 날짜 · 당당을 찍은 파일. 화면 스탬프와 같은 비율(390px 기준)
export async function stampPhoto(photo: Blob, at: Date, mealLabel: string) {
  const bitmap = await createImageBitmap(photo)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const context = canvas.getContext('2d')
  if (!context) return null
  context.drawImage(bitmap, 0, 0)
  bitmap.close()

  const unit = canvas.width / 390
  const left = 16 * unit
  let baseline = canvas.height - 16 * unit
  context.shadowColor = STAMP_SHADOW
  context.shadowBlur = 4 * unit
  context.shadowOffsetY = unit
  context.textBaseline = 'alphabetic'
  const lines: [string, number, string, string][] = [
    ['당당', 12, '700', STAMP_BRAND],
    [formatStampDate(at, mealLabel), 15, '500', '#ffffff'],
    [formatTime(at), 44, '700', '#ffffff'],
  ]
  // 아래 줄부터 위로 쌓음
  lines.forEach(([text, size, weight, color]) => {
    context.font = `${weight} ${size * unit}px 'Pretendard Variable', sans-serif`
    context.fillStyle = color
    context.fillText(text, left, baseline)
    baseline -= size * 1.35 * unit
  })

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.92),
  )
  if (!blob) return null
  const name = `dangdang-${at.getFullYear()}${String(at.getMonth() + 1).padStart(2, '0')}${String(
    at.getDate(),
  ).padStart(2, '0')}-${formatTime(at).replace(':', '')}.jpg`
  return new File([blob], name, { type: 'image/jpeg' })
}

// 웹에선 사진첩에 바로 못 넣어서 공유 시트(이미지 저장)로, 안 되면 파일로 내려받기
export async function savePhotoToAlbum(file: File) {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return true
    } catch (error) {
      // 사용자가 공유 시트를 닫은 경우
      if (error instanceof DOMException && error.name === 'AbortError') return false
    }
  }
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  // 내려받기가 시작된 뒤 정리
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}
