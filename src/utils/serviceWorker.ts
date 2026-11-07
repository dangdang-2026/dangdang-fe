// 개발 서버에선 캐시가 화면 갱신을 막지 않게 등록 안 함(빌드·미리보기에서만)
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // 등록 실패해도 앱은 그대로 씀
    })
  })
}
