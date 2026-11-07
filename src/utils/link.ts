// 외부 자료 열기. 폰은 공유 시트, 아니면 새 탭. 링크가 없으면 false
export async function openExternal(title: string, url: string | null) {
  if (!url) return false
  if (navigator.share) {
    // 공유를 닫아도 실패로 보지 않음
    await navigator.share({ title, url }).catch(() => undefined)
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  return true
}
