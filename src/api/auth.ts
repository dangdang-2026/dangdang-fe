import { apiClient, getErrorCode, getErrorData, type BaseResponse } from '@/api/axios'
import type { AccountProfile } from '@/mocks/auth'

// 연속으로 틀리면 잠깐 잠금. 횟수 · 시간은 서버 정책 값
export const LOGIN_MAX_FAILURES = 5
export const LOGIN_LOCK_MINUTES = 5

// 서버 AuthRetryInfo. 로그인 실패면 남은 횟수, 잠금이면 풀리기까지 남은 초
type AuthRetryInfo = { remainingAttempts: number; retryAfterSeconds: number }

export type EmailLoginResult =
  // 데모 계정이면 계정 정보도 함께
  | { status: 'ok'; profile?: AccountProfile }
  // 남은 횟수를 못 읽으면 null
  | { status: 'wrong'; remaining: number | null }
  // 풀리는 시각
  | { status: 'locked'; until: Date }

// 성공하면 서버가 ACCESS_TOKEN · REFRESH_TOKEN 쿠키를 심음
// 없는 이메일 · 카카오로 가입한 이메일도 같은 실패로 옴(가입 여부를 드러내지 않음)
export async function loginWithEmail(email: string, password: string): Promise<EmailLoginResult> {
  try {
    await apiClient.post('/auth/login', { email, password })
  } catch (error) {
    const code = getErrorCode(error)
    const data = getErrorData<AuthRetryInfo>(error)
    if (code === 'AUTH_40004')
      return { status: 'wrong', remaining: data?.remainingAttempts ?? null }
    if (code === 'AUTH_42902') {
      // 남은 시간이 없으면 정책 값(5분)으로
      const seconds = data?.retryAfterSeconds ?? LOGIN_LOCK_MINUTES * 60
      return { status: 'locked', until: new Date(Date.now() + seconds * 1000) }
    }
    throw error
  }
  return { status: 'ok' }
}

// 서버 Refresh 토큰을 무효로 하고 쿠키 두 개를 지움. 토큰이 없어도 200
export async function logoutFromServer() {
  await apiClient.post('/auth/logout')
}

// 카카오 콘솔에 등록한 주소와 글자까지 같아야 함. 서버 토큰 교환에도 같은 값 보냄
const KAKAO_REDIRECT_URI =
  import.meta.env.VITE_KAKAO_REDIRECT_URI || `${window.location.origin}/auth/kakao/callback`
const KAKAO_STATE_KEY = 'kakao-oauth-state'
const KAKAO_PURPOSE_KEY = 'kakao-oauth-purpose'

// login: 카카오로 로그인 · 가입, link: 로그인한 계정에 카카오 연결
export type KakaoPurpose = 'login' | 'link'

// 카카오 인가 페이지로 이동. state로 남이 만든 콜백 요청을 걸러냄
// selectAccount면 카카오계정을 다시 고르게 함(K-07 다른 카카오계정으로 시작하기)
export function startKakaoLogin({
  selectAccount = false,
  purpose = 'login',
}: { selectAccount?: boolean; purpose?: KakaoPurpose } = {}) {
  const state = crypto.randomUUID()
  sessionStorage.setItem(KAKAO_STATE_KEY, state)
  sessionStorage.setItem(KAKAO_PURPOSE_KEY, purpose)
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_KAKAO_REST_API_KEY,
    redirect_uri: KAKAO_REDIRECT_URI,
    response_type: 'code',
    state,
  })
  if (selectAccount) params.set('prompt', 'select_account')
  window.location.assign(`https://kauth.kakao.com/oauth/authorize?${params}`)
}

// 보낸 state와 같으면 무엇 하러 갔는지, 다르면 null. 한 번 쓰면 지움
export function consumeKakaoState(state: string | null): KakaoPurpose | null {
  const saved = sessionStorage.getItem(KAKAO_STATE_KEY)
  const purpose = sessionStorage.getItem(KAKAO_PURPOSE_KEY) === 'link' ? 'link' : 'login'
  sessionStorage.removeItem(KAKAO_STATE_KEY)
  sessionStorage.removeItem(KAKAO_PURPOSE_KEY)
  return !!saved && saved === state ? purpose : null
}

// 가입 · 연결에 한 번 쓰는 카카오 토큰. 서버 유효 시간 10분
const KAKAO_PENDING_KEY = 'kakao-pending'
const KAKAO_PENDING_MS = 10 * 60 * 1000

function savePendingKakao(token: string) {
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

// 백엔드 KakaoLoginResponse
type KakaoLoginResponse = {
  result: 'LOGGED_IN' | 'NEEDS_SIGNUP' | 'EMAIL_ACCOUNT_EXISTS'
  kakaoToken: string | null
  email: string | null
  maskedEmail: string | null
}

export type KakaoLoginResult =
  | { status: 'loggedIn' }
  | { status: 'needsSignup' }
  | { status: 'emailAccount'; email: string; maskedEmail: string }

// 인가 코드를 서버에 넘김. 쿠키는 이미 가입 · 연결된 카카오일 때만 옴
// 처음 보는 카카오면 가입 확인, 같은 이메일 계정이 있으면 이메일 로그인 안내. 둘 다 토큰을 들고 감
export async function loginWithKakao(code: string): Promise<KakaoLoginResult> {
  const { data } = await apiClient.post<BaseResponse<KakaoLoginResponse>>('/auth/kakao', {
    code,
    redirectUri: KAKAO_REDIRECT_URI,
  })
  const body = data.data
  if (!body) throw new Error('카카오 로그인 응답이 비어 있음')
  clearPendingKakao()
  if (body.result === 'LOGGED_IN') return { status: 'loggedIn' }
  if (body.kakaoToken) savePendingKakao(body.kakaoToken)
  if (body.result === 'EMAIL_ACCOUNT_EXISTS') {
    return { status: 'emailAccount', email: body.email ?? '', maskedEmail: body.maskedEmail ?? '' }
  }
  return { status: 'needsSignup' }
}

// expired: 토큰 10분 지남 · 이미 씀, noEmail: 카카오 이메일 인증 안 됨
// emailAccount: 같은 이메일 계정 있음, linked: 이 카카오가 다른 계정에 연결됨
export type KakaoSignupResult = 'ok' | 'expired' | 'noEmail' | 'emailAccount' | 'linked'

const KAKAO_SIGNUP_ERRORS: Record<string, Exclude<KakaoSignupResult, 'ok'>> = {
  AUTH_40011: 'expired',
  GLOBAL_40001: 'expired',
  AUTH_40012: 'noEmail',
  AUTH_40902: 'emailAccount',
  AUTH_40903: 'linked',
}

// 처음 보는 카카오로 가입. 성공하면 쿠키가 오고 토큰은 서버에서 쓰여 없어짐
export async function signUpWithKakao(): Promise<KakaoSignupResult> {
  const kakaoToken = getPendingKakaoToken()
  if (!kakaoToken) return 'expired'
  try {
    await apiClient.post('/auth/kakao/signup', { kakaoToken })
  } catch (error) {
    const result = KAKAO_SIGNUP_ERRORS[getErrorCode(error) ?? '']
    if (!result) throw error
    if (result === 'expired') clearPendingKakao()
    return result
  }
  clearPendingKakao()
  return 'ok'
}

// expired: 토큰 10분 지남 · 이미 씀(카카오를 새로 거쳐야 함), connected: 이미 연결됨, linked: 이 카카오가 다른 계정에 연결됨
export type KakaoLinkResult = 'ok' | 'expired' | 'connected' | 'linked'

const KAKAO_LINK_ERRORS: Record<string, Exclude<KakaoLinkResult, 'ok'>> = {
  AUTH_40011: 'expired',
  AUTH_40904: 'connected',
  AUTH_40903: 'linked',
}

// 로그인한 계정에 카카오 연결. 받아 둔 토큰이 있으면 그걸로, 없으면 카카오를 다녀온 인가 코드로
export async function linkKakao(code?: string): Promise<KakaoLinkResult> {
  const kakaoToken = code ? null : getPendingKakaoToken()
  if (!code && !kakaoToken) return 'expired'
  try {
    await apiClient.post(
      '/me/kakao',
      code ? { code, redirectUri: KAKAO_REDIRECT_URI } : { kakaoToken },
    )
  } catch (error) {
    const result = KAKAO_LINK_ERRORS[getErrorCode(error) ?? '']
    if (!result) throw error
    if (result === 'expired') clearPendingKakao()
    return result
  }
  clearPendingKakao()
  return 'ok'
}

export type EmailOwner = 'none' | 'email' | 'kakao'

// 백엔드 EmailAvailabilityResponse
type EmailAvailability = {
  available: boolean
  authProvider: 'EMAIL' | 'KAKAO' | null
}

// 가입 화면 중복 확인. 이미 쓰는 이메일이면 가입 방법까지 알려 줌
export async function checkEmail(email: string): Promise<EmailOwner> {
  const { data } = await apiClient.post<BaseResponse<EmailAvailability>>(
    '/auth/email/availability',
    { email },
  )
  const result = data.data
  if (!result || result.available) return 'none'
  return result.authProvider === 'KAKAO' ? 'kakao' : 'email'
}

// 인증번호는 10분 동안만, 5번 틀리면 무효, 하루 5번까지 발송, 다시 받기는 60초 뒤. 서버 정책 값
export const VERIFY_CODE_LENGTH = 6
export const VERIFY_TTL_MS = 10 * 60 * 1000
export const VERIFY_MAX_FAILURES = 5
export const VERIFY_MAX_SENDS = 5
const RESEND_WAIT_MS = 60 * 1000

// 서버 EmailCodeSendResponse
type EmailCodeSendResponse = {
  remainingSends: number
  expiresInSeconds: number
  resendAfterSeconds: number
}

// 인증번호를 보낸 상태. resendAt: 다시 받을 수 있는 시각, remainingSends: 오늘 더 받을 수 있는 횟수(모르면 null)
export type CodeSent = { sentAt: number; resendAt: number; remainingSends: number | null }

export type SendCodeResult =
  | ({ status: 'ok' } & CodeSent)
  // AUTH_42904 60초 안에 다시 보냄. 앞서 보낸 번호는 그대로 씀
  | { status: 'wait'; resendAt: number }
  // AUTH_50202 메일 서버 오류. 오늘 횟수는 돌려받고 60초 뒤 다시
  | { status: 'mailFailed'; resendAt: number }
  // AUTH_40901 이미 가입된 이메일
  | { status: 'taken' }
  // AUTH_42901 하루 발송 횟수 초과
  | { status: 'limit' }

// 기다릴 시각. 응답을 받은 때부터 셈(요청이 늦어도 서버 대기보다 짧아지지 않게). 남은 초가 없으면 정책 값(60초)
const waitUntil = (seconds: number | undefined) =>
  Date.now() + (seconds ?? RESEND_WAIT_MS / 1000) * 1000

// 인증번호 메일 발송. 번호 유효 시간은 요청한 때부터 셈(실제보다 길게 보이지 않게)
export async function sendVerifyCode(email: string): Promise<SendCodeResult> {
  const requestedAt = Date.now()
  try {
    const { data } = await apiClient.post<BaseResponse<EmailCodeSendResponse>>('/auth/email/code', {
      email,
    })
    return {
      status: 'ok',
      sentAt: requestedAt,
      resendAt: waitUntil(data.data?.resendAfterSeconds),
      remainingSends: data.data?.remainingSends ?? null,
    }
  } catch (error) {
    const code = getErrorCode(error)
    const retry = getErrorData<AuthRetryInfo>(error)?.retryAfterSeconds
    if (code === 'AUTH_42904') return { status: 'wait', resendAt: waitUntil(retry) }
    if (code === 'AUTH_50202') return { status: 'mailFailed', resendAt: waitUntil(retry) }
    if (code === 'AUTH_40901') return { status: 'taken' }
    if (code === 'AUTH_42901') return { status: 'limit' }
    throw error
  }
}

export type VerifyResult =
  | { status: 'ok' }
  // 남은 횟수를 못 읽으면 null
  | { status: 'wrong'; remaining: number | null }
  // AUTH_40010 5번 틀림. 번호를 다시 받아야 함
  | { status: 'tooMany' }
  // AUTH_40001 10분 지남
  | { status: 'expired' }

// 이미 인증된 이메일을 다시 확인해도 200
export async function verifyEmailCode(email: string, code: string): Promise<VerifyResult> {
  try {
    await apiClient.post('/auth/email/verify', { email, code })
  } catch (error) {
    const errorCode = getErrorCode(error)
    if (errorCode === 'AUTH_40002') {
      const remaining = getErrorData<AuthRetryInfo>(error)?.remainingAttempts ?? null
      return remaining === 0 ? { status: 'tooMany' } : { status: 'wrong', remaining }
    }
    if (errorCode === 'AUTH_40010') return { status: 'tooMany' }
    if (errorCode === 'AUTH_40001') return { status: 'expired' }
    throw error
  }
  return { status: 'ok' }
}

export type CompleteSignUpResult =
  | { status: 'ok' }
  // AUTH_40003 인증 후 30분 지남
  | { status: 'notVerified' }
  // AUTH_40901 그 사이 같은 이메일로 가입됨
  | { status: 'taken' }
  // 가입은 됐는데 로그인만 실패
  | { status: 'loginFailed' }

// 인증을 마친 뒤 가입. 가입 응답엔 토큰이 없어 바로 로그인해 쿠키 받음
export async function completeSignUp(
  name: string,
  email: string,
  password: string,
): Promise<CompleteSignUpResult> {
  try {
    await apiClient.post('/auth/signup', { email, displayName: name, password })
  } catch (error) {
    const code = getErrorCode(error)
    if (code === 'AUTH_40003') return { status: 'notVerified' }
    if (code === 'AUTH_40901') return { status: 'taken' }
    throw error
  }
  try {
    await apiClient.post('/auth/login', { email, password })
  } catch {
    return { status: 'loginFailed' }
  }
  return { status: 'ok' }
}

// resendAt: 다시 보낼 수 있는 시각
export type ResetRequestResult =
  | { status: 'ok'; resendAt: number }
  // AUTH_42904 60초 안에 다시 보냄
  | { status: 'wait'; resendAt: number }
  // AUTH_42903 같은 이메일로 하루 5번 넘게 보냄
  | { status: 'limit' }

// 가입 여부와 상관없이 같은 응답(계정 노출 방지). 이메일로 가입한 계정에만 링크 발급
export async function requestPasswordReset(email: string): Promise<ResetRequestResult> {
  try {
    await apiClient.post('/auth/password/reset/request', { email })
  } catch (error) {
    const code = getErrorCode(error)
    if (code === 'AUTH_42904') {
      const retry = getErrorData<AuthRetryInfo>(error)?.retryAfterSeconds
      return { status: 'wait', resendAt: waitUntil(retry) }
    }
    if (code === 'AUTH_42903') return { status: 'limit' }
    throw error
  }
  return { status: 'ok', resendAt: waitUntil(undefined) }
}

export type ResetPasswordResult = { status: 'ok' } | { status: 'same' } | { status: 'expired' }

// 링크 토큰으로 새 비밀번호 저장. 성공하면 모든 기기 로그아웃
export async function resetPassword(token: string, password: string): Promise<ResetPasswordResult> {
  try {
    await apiClient.post('/auth/password/reset/confirm', { token, newPassword: password })
  } catch (error) {
    const code = getErrorCode(error)
    // 30분 지났거나 이미 쓴 링크
    if (code === 'AUTH_40008') return { status: 'expired' }
    // 링크는 그대로라 다시 입력 가능
    if (code === 'AUTH_40009') return { status: 'same' }
    throw error
  }
  return { status: 'ok' }
}

export type ChangePasswordResult = { status: 'ok' } | { status: 'wrong' } | { status: 'same' }

// 마이 > 비밀번호 바꾸기. 성공하면 서버가 새 토큰 쿠키를 심고 다른 기기는 로그아웃
export async function changePassword(current: string, next: string): Promise<ChangePasswordResult> {
  try {
    await apiClient.patch('/me/password', { currentPassword: current, newPassword: next })
  } catch (error) {
    const code = getErrorCode(error)
    if (code === 'USER_40003') return { status: 'wrong' }
    if (code === 'AUTH_40009') return { status: 'same' }
    throw error
  }
  return { status: 'ok' }
}

// 탈퇴할 때 커뮤니티 글·댓글을 지울지, '탈퇴한 회원'으로 남길지
export type CommunityPostsOnLeave = 'delete' | 'keep'

// 회원 탈퇴(M-08). 이메일 가입자만 비밀번호, 틀리면 400 USER_40003. 성공하면 서버가 쿠키를 지움
export async function deleteAccount(
  password: string | null,
  posts: CommunityPostsOnLeave,
): Promise<void> {
  await apiClient.post('/me/withdrawal', {
    password: password ?? undefined,
    keepPosts: posts === 'keep',
  })
}
