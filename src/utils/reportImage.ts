import { toBlob } from 'html-to-image'

export type ReportImageResult = 'shared' | 'downloaded' | 'canceled'

// 손가락으로 누르는 기기(휴대폰 · 태블릿)면 공유 창으로 사진첩 저장
const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches

// 이미지 파일을 바로 내려받음. 컴퓨터 · 공유 창이 안 되는 브라우저
function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

// 리포트 화면을 PNG로 만들어 휴대폰은 공유 창(이미지 저장), 컴퓨터는 파일로 내려받음
export async function saveReportImage(
  node: HTMLElement,
  fileName: string,
): Promise<ReportImageResult> {
  // 선명하게 2배, 둥근 모서리 밖은 흰색
  const blob = await toBlob(node, { pixelRatio: 2, backgroundColor: '#ffffff' })
  if (!blob) throw new Error('리포트 이미지를 만들지 못함')
  const file = new File([blob], fileName, { type: 'image/png' })

  if (isTouchDevice() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (error) {
      // 공유 창을 닫으면 저장 안 함. 그 밖의 실패(시간 지나 막힘 등)는 내려받기로
      if (error instanceof DOMException && error.name === 'AbortError') return 'canceled'
    }
  }
  download(blob, fileName)
  return 'downloaded'
}
