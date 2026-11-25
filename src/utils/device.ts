// 홈 화면에 추가한 앱으로 열었는지
export const isInstalledApp = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

// 아이폰 · 아이패드. 아이패드는 데스크톱 사파리처럼 보여 터치로 구분
export const isAppleMobile = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

// 카카오톡 안 브라우저
export const isKakaoInApp = () => /KAKAOTALK/i.test(navigator.userAgent)

// 가입 마지막 홈 화면 추가 안내가 필요한지. 아이폰은 홈 화면 앱에서만 알림이 와서
export const needsHomeScreenGuide = () => isAppleMobile() && !isInstalledApp()
