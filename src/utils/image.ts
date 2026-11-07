// 긴 변 기준 최대 크기. 기기 저장 용량을 아끼려고 줄여서 보관
const MAX_SIDE = 1280
const JPEG_QUALITY = 0.8

// 고른 사진을 줄여 data URL로. 원본 파일은 보관하지 않음
export async function resizeImageFile(file: File) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}
