import { toBlob } from 'html-to-image'

export type ReportImageResult = 'shared' | 'downloaded' | 'canceled'

// 손가락으로 누르는 기기(휴대폰 · 태블릿)면 공유 창으로 사진첩 저장
const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches

// 리포트 화면을 PNG로. 사파리는 첫 변환에 그림 · 글꼴이 빠질 수 있어 두 번 만들어 두 번째를 씀
export async function createReportImage(node: HTMLElement) {
  // 선명하게 2배, 둥근 모서리 밖은 흰색
  const options = { pixelRatio: 2, backgroundColor: '#ffffff' }
  await toBlob(node, options)
  const blob = await toBlob(node, options)
  if (!blob) throw new Error('리포트 이미지를 만들지 못함')
  return blob
}

// 이미지 파일을 바로 내려받음. 내려받기가 시작되기 전에 주소가 지워지지 않게 잠시 뒤 정리
function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// 미리 만든 이미지를 휴대폰은 공유 창(이미지 저장), 컴퓨터는 파일로 내려받음
// 누른 직후에 공유 창을 띄워야 해서 이미지는 누르기 전에 만들어 둠
export async function saveReportImage(blob: Blob, fileName: string): Promise<ReportImageResult> {
  const file = new File([blob], fileName, { type: 'image/png' })
  if (isTouchDevice() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (error) {
      // 공유 창을 닫으면 저장 안 함. 그 밖의 실패는 내려받기로
      if (error instanceof DOMException && error.name === 'AbortError') return 'canceled'
    }
  }
  download(blob, fileName)
  return 'downloaded'
}
