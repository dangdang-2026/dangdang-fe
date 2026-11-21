import { getFontEmbedCSS, toBlob } from 'html-to-image'

export type ReportImageResult = 'shared' | 'downloaded' | 'canceled'

// 아이폰 · 아이패드만 공유 창(이미지 저장). 안드로이드 공유 창엔 갤러리 저장이 없어 내려받기
const isAppleMobile = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

// 글꼴을 넣는 CSS는 한 번만 만들어 다시 씀. 글꼴 파일이 많아 매번 만들면 느림
let fontEmbedCSS: Promise<string> | null = null

// 리포트 화면을 PNG로. 사파리는 첫 변환에 그림 · 글꼴이 빠질 수 있어 두 번 만들어 두 번째를 씀
export async function createReportImage(node: HTMLElement) {
  fontEmbedCSS ??= getFontEmbedCSS(node).catch((error: unknown) => {
    fontEmbedCSS = null
    throw error
  })
  // 선명하게 2배, 둥근 모서리 밖은 흰색
  const options = { pixelRatio: 2, backgroundColor: '#ffffff', fontEmbedCSS: await fontEmbedCSS }
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

// 아이폰은 공유 창, 그 밖은 내려받기(공유 창은 누른 직후에만 떠서 이미지는 미리 만들어 둠)
export async function saveReportImage(blob: Blob, fileName: string): Promise<ReportImageResult> {
  const file = new File([blob], fileName, { type: 'image/png' })
  if (isAppleMobile() && navigator.canShare?.({ files: [file] })) {
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
