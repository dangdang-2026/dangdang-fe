// 가입 · 연결에 한 번 쓰는 카카오 토큰. 서버 유효 시간 10분. 로그아웃하면 지움
const KAKAO_PENDING_KEY = 'kakao-pending'
const KAKAO_PENDING_MS = 10 * 60 * 1000

export function savePendingKakao(token: string) {
  sessionStorage.setItem(
    KAKAO_PENDING_KEY,
    JSON.stringify({ token, expiresAt: Date.now() + KAKAO_PENDING_MS }),
  )
}

// 10분이 지났거나 없으면 null
export function getPendingKakaoToken(): string | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KAKAO_PENDING_KEY) ?? 'null') as {
      token: string
      expiresAt: number
    } | null
    return saved && saved.expiresAt > Date.now() ? saved.token : null
  } catch {
    return null
  }
}

export function clearPendingKakao() {
  sessionStorage.removeItem(KAKAO_PENDING_KEY)
}
