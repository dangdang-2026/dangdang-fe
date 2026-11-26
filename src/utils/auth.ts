import { ROUTES } from '@/constants/routes'

// @ 없음, 도메인 없음, 한글·특수문자 포함은 형식 오류
export const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

// 서버 규칙: 8~64자, 영문 · 숫자 모두, 키보드 문자(특수문자 포함)만. 한글 · 띄어쓰기 안 됨
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 64

// 자주 틀리는 도메인 → 맞는 도메인
const DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'naver.con': 'naver.com',
  'navre.com': 'naver.com',
  'naver.co': 'naver.com',
  'hanmial.net': 'hanmail.net',
  'hanmail.ent': 'hanmail.net',
  'daum.ent': 'daum.net',
  'nate.con': 'nate.com',
}

// 오타로 보이면 고친 도메인, 아니면 null
export function suggestDomain(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase()
  return (domain && DOMAIN_TYPOS[domain]) ?? null
}

export function replaceDomain(email: string, domain: string) {
  return `${email.split('@')[0]}@${domain}`
}

// invalid: 띄어쓰기면 space, 한글 등 키보드 밖 글자면 letter
export function checkPassword(password: string) {
  return {
    length: password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX,
    mix: /[A-Za-z]/.test(password) && /\d/.test(password),
    invalid: /\s/.test(password)
      ? ('space' as const)
      : /[^\x21-\x7E]/.test(password)
        ? ('letter' as const)
        : null,
  }
}

// 조건을 다 맞추고 확인 칸까지 같아야 제출 가능
export function isNewPasswordValid(password: string, confirm: string) {
  const checks = checkPassword(password)
  return checks.length && checks.mix && !checks.invalid && confirm === password
}

// 카카오 로그인이 이메일 계정과 겹쳐 로그인 화면이 K-07 시트를 띄우는 error 값
export const EMAIL_ACCOUNT_EXISTS = 'email_account_exists'

// 카카오 연결 결과 → 오늘 화면 토스트. 서버 문구와 같게
export type KakaoLinkOutcome = 'ok' | 'connected' | 'linked' | 'expired' | 'cancel' | 'failed'
export const KAKAO_LINK_TOAST: Record<KakaoLinkOutcome, string> = {
  ok: '카카오를 연결했어요. 다음부터 카카오로 바로 로그인할 수 있어요',
  connected: '이미 카카오가 연결돼 있어요',
  linked: '이 카카오 계정은 다른 당당 계정에 이미 연결돼 있어요. 그 계정으로 로그인해 주세요',
  expired: '카카오 확인 시간이 지났어요. 다시 연결해 주세요',
  cancel: '카카오 연결을 취소했어요',
  failed: '카카오를 연결하지 못했어요. 잠시 후 다시 시도해 주세요',
}

// 탈퇴 즉시 기기에 남은 기록도 모두 지우고 처음 화면으로 새로 열기
export function restartAfterWithdraw() {
  Object.keys(localStorage)
    .filter((key) => key.startsWith('dangdang-'))
    .forEach((key) => localStorage.removeItem(key))
  window.location.replace(ROUTES.ONBOARDING)
}

// 건강정보 동의를 철회하면 서버가 지운 건강 기록을 기기에서도 지우고 가입 동의(A-01)부터. 계정 · 내 음식 · 커뮤니티 · 알림 설정은 남김
const HEALTH_STORES = [
  'dangdang-glucose',
  'dangdang-criteria',
  'dangdang-visit',
  'dangdang-reports',
  'dangdang-hospital',
  'dangdang-meal-guide',
  'dangdang-inbox',
  'dangdang-profile',
  'dangdang-onboarding',
]
export function restartAfterSensitiveWithdraw() {
  HEALTH_STORES.forEach((key) => localStorage.removeItem(key))
  window.location.replace(ROUTES.ONBOARDING_TERMS)
}

// 카카오로 본인 확인한 탈퇴가 막혔을 때 데이터 화면 토스트. 서버 문구와 같게
export const KAKAO_WITHDRAW_TOAST: Record<string, string> = {
  USER_40301: '지금 로그인한 카카오 계정과 달라요. 이 계정의 카카오로 확인해 주세요',
  USER_40004: '카카오로 한 번 더 확인해 주세요',
  AUTH_40006: '카카오 확인에 실패했어요. 다시 시도해 주세요',
  cancel: '카카오 확인을 취소해서 탈퇴하지 않았어요',
  failed: '탈퇴하지 못했어요. 잠시 후 다시 시도해 주세요',
}
