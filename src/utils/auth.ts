import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/stores/useAuthStore'
import { clearPendingKakao } from '@/utils/kakaoPending'

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

// 기기 구독 끊기. 순환 import라 푸시 모듈이 등록
let unsubscribeDevice: (() => Promise<void>) | null = null
export function setDeviceUnsubscribe(unsubscribe: () => Promise<void>) {
  unsubscribeDevice = unsubscribe
}

// 기기 구독을 끊으며 기다리는 최대 시간
const UNSUBSCRIBE_WAIT_MS = 1500

// 서버 구독 삭제를 못 할 때 기기 구독만 끊음(최대 1.5초)
export function unsubscribeDeviceOnly() {
  return Promise.race([
    (unsubscribeDevice?.() ?? Promise.resolve()).catch(() => {}),
    new Promise((resolve) => window.setTimeout(resolve, UNSUBSCRIBE_WAIT_MS)),
  ])
}

// 탈퇴 정리 중. 그사이 세션 끝남 처리가 먼저 페이지를 옮기지 않게
let withdrawing = false
export const isWithdrawing = () => withdrawing

// 탈퇴하면 기록부터 지우고 다른 탭에 알린 뒤 기기 구독을 끊고 처음 화면으로. 정리 중 오류는 탈퇴 실패로 넘기지 않음
export async function restartAfterWithdraw() {
  withdrawing = true
  try {
    clearPendingKakao()
    clearAllKeys()
    window.addEventListener('pagehide', clearAllKeys)
    localStorage.setItem(WITHDRAW_KEY, String(Date.now()))
  } catch {
    // 저장소를 못 쓰면 떠나기 전에 다시 지움
  }
  await unsubscribeDeviceOnly()
  window.location.replace(ROUTES.ONBOARDING)
}

// 기기의 당당 기록을 모두 지움
function clearAllKeys() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('dangdang-'))
      .forEach((key) => localStorage.removeItem(key))
  } catch {
    // 저장소를 못 쓰는 환경
  }
}

// 모두 지우고 처음 화면으로. 떠나기 전 끝난 동기화가 다시 써도 한 번 더 지움
function clearAllAndLeave() {
  clearAllKeys()
  window.addEventListener('pagehide', clearAllKeys)
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
  clearAndLeave(HEALTH_STORES, ROUTES.ONBOARDING_TERMS, CONSENT_RESTART_KEY)
}

// 이 기기 기록의 주인 계정. 로그아웃하면 다른 계정 기록과 함께 지움
export const DEVICE_OWNER_KEY = 'dangdang-owner'

// 로그아웃하면 지우는 이 계정 저장소. 로그인 방식은 기기 설정이라 남김
const ACCOUNT_STORES = [
  ...HEALTH_STORES,
  'dangdang-foods',
  'dangdang-community',
  'dangdang-meal-settings',
  'dangdang-ai',
  DEVICE_OWNER_KEY,
]

// 다른 탭에 알리는 키(값은 알린 시각)
const CONSENT_RESTART_KEY = 'dangdang-consent-restart'
const LOGOUT_KEY = 'dangdang-logout'
const SESSION_END_KEY = 'dangdang-session-end'
const WITHDRAW_KEY = 'dangdang-withdraw'

// 지우고 옮김. 떠나기 전 끝난 요청이 기기 저장을 다시 써도 페이지를 닫을 때 한 번 더 지움
// broadcastKey가 있으면 열려 있는 다른 탭도 같은 일을 하게 알림(그 탭이 지운 기록을 다시 쓰지 않게)
function clearAndLeave(keys: string[], to: string, broadcastKey?: string) {
  const clear = () => keys.forEach((key) => localStorage.removeItem(key))
  clear()
  if (broadcastKey) localStorage.setItem(broadcastKey, String(Date.now()))
  window.addEventListener('pagehide', clear)
  window.location.replace(to)
}

// 알림 설정은 서버 값이라 비우고 권한 물어봤는지(기기 값)만 남김
const NOTIFICATION_STORE = 'dangdang-notification'
function keepDeviceNotificationOnly() {
  try {
    const saved = JSON.parse(localStorage.getItem(NOTIFICATION_STORE) ?? 'null')
    if (!saved?.state) return
    localStorage.setItem(
      NOTIFICATION_STORE,
      JSON.stringify({ ...saved, state: { permissionAsked: !!saved.state.permissionAsked } }),
    )
  } catch {
    localStorage.removeItem(NOTIFICATION_STORE)
  }
}

// 로그아웃 뒤 이 계정 기록을 기기에서 지우고 처음 화면으로. 다음 사람이 앞 계정 정보를 못 보게
export function leaveAfterLogout() {
  keepDeviceNotificationOnly()
  clearAndLeave(ACCOUNT_STORES, ROUTES.ONBOARDING, LOGOUT_KEY)
}

// 세션이 끝나면 기록은 두고 처음 화면으로(다른 계정이면 로그인 때 비움)
export function leaveAfterSessionEnd() {
  clearAndLeave([], ROUTES.ONBOARDING, SESSION_END_KEY)
}

// 다른 탭에서 철회 · 동의 없음 · 로그아웃으로 기록을 지우면 이 탭도 같이. 앱 전체에서 한 번 켬
export function listenForConsentRestart() {
  const onStorage = (event: StorageEvent) => {
    // 이 탭이 탈퇴 정리 중이면 그쪽이 마무리
    if (!event.newValue || isWithdrawing()) return
    if (event.key === CONSENT_RESTART_KEY) clearAndLeave(HEALTH_STORES, ROUTES.ONBOARDING_TERMS)
    // 카카오 대기 토큰은 탭마다 따로라 이 탭 것도 지움
    if (event.key === LOGOUT_KEY) {
      clearPendingKakao()
      keepDeviceNotificationOnly()
      clearAndLeave(ACCOUNT_STORES, ROUTES.ONBOARDING)
    }
    // 로그인한 탭만. 카카오 가입 중인 로그아웃 탭은 그대로
    if (event.key === SESSION_END_KEY && useAuthStore.getState().account) {
      clearPendingKakao()
      clearAndLeave([], ROUTES.ONBOARDING)
    }
    if (event.key === WITHDRAW_KEY) {
      clearPendingKakao()
      clearAllAndLeave()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}

// 건강정보 동의가 없으면(다른 기기에서 철회 · 문서 버전 바뀜) 서버가 지운 건강 기록 · 설정 진행을 비우고 가입 동의(A-01)부터
// 이미 첫 진입 설정 중이면 그대로. 다시 동의하면 기록은 서버에서 전부 다시 받음
export function restartForConsent() {
  if (window.location.pathname.startsWith(ROUTES.ONBOARDING)) return
  clearAndLeave(HEALTH_STORES, ROUTES.ONBOARDING_TERMS, CONSENT_RESTART_KEY)
}

// 카카오로 본인 확인한 탈퇴가 막혔을 때 데이터 화면 토스트. 서버 문구와 같게
export const KAKAO_WITHDRAW_TOAST: Record<string, string> = {
  USER_40301: '지금 로그인한 카카오 계정과 달라요. 이 계정의 카카오로 확인해 주세요',
  USER_40004: '카카오로 한 번 더 확인해 주세요',
  AUTH_40006: '카카오 확인에 실패했어요. 다시 시도해 주세요',
  cancel: '카카오 확인을 취소해서 탈퇴하지 않았어요',
  failed: '탈퇴하지 못했어요. 잠시 후 다시 시도해 주세요',
}
