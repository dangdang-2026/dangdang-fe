import { apiClient, getErrorCode, type BaseResponse } from '@/api/axios'
import { MOCK_ACCOUNTS, MOCK_RESET_TOKEN, type AccountProfile } from '@/mocks/auth'

// 연속으로 틀리면 잠깐 잠금. 횟수·시간은 서버 정책 값
export const LOGIN_MAX_FAILURES = 5
const LOCK_MS = 10 * 60 * 1000
const MOCK_DELAY_MS = 800

export type EmailLoginResult =
  // 데모 계정이면 계정 정보도 함께
  | { status: 'ok'; profile?: AccountProfile }
  | { status: 'wrong'; failures: number }
  | { status: 'locked'; minutes: number }
  // 카카오로 가입한 이메일이라 비밀번호 없음
  | { status: 'kakao' }

// 서버 연동 전 목업. 틀린 횟수·잠금은 이메일별로 메모리에만
const failureCount = new Map<string, number>()
const lockedUntil = new Map<string, number>()

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

export async function loginWithEmail(email: string, password: string): Promise<EmailLoginResult> {
  await wait(MOCK_DELAY_MS)

  const until = lockedUntil.get(email) ?? 0
  if (until > Date.now()) {
    return { status: 'locked', minutes: Math.ceil((until - Date.now()) / 60000) }
  }

  const account = MOCK_ACCOUNTS.find((item) => item.email === email)
  if (account?.method === 'kakao') return { status: 'kakao' }
  if (account?.password === password) {
    failureCount.delete(email)
    return { status: 'ok', profile: account.profile }
  }

  const failures = (failureCount.get(email) ?? 0) + 1
  if (failures >= LOGIN_MAX_FAILURES) {
    failureCount.delete(email)
    lockedUntil.set(email, Date.now() + LOCK_MS)
    return { status: 'locked', minutes: LOCK_MS / 60000 }
  }
  failureCount.set(email, failures)
  return { status: 'wrong', failures }
}

// 카카오 SDK·서버 연동 전이라 바로 성공
export async function loginWithKakao(): Promise<void> {
  await wait(MOCK_DELAY_MS)
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

// 인증번호는 10분 동안만, 5번 틀리면 무효, 하루 5번까지 발송. 서버 정책 값
export const VERIFY_CODE_LENGTH = 6
export const VERIFY_TTL_MS = 10 * 60 * 1000
export const VERIFY_MAX_FAILURES = 5
export const VERIFY_MAX_SENDS = 5

// 이메일별 틀린 횟수. 서버가 횟수를 안 알려 줘서 프론트에서 셈
const verifyFailures = new Map<string, number>()

export type SendCodeResult =
  | { status: 'ok'; sentAt: number }
  // AUTH_40901 이미 가입된 이메일
  | { status: 'taken' }
  // AUTH_42901 하루 발송 횟수 초과
  | { status: 'limit' }

// 인증번호 메일 발송. 서버가 보낸 시각을 안 줘서 프론트 시각으로 타이머
export async function sendVerifyCode(email: string): Promise<SendCodeResult> {
  try {
    await apiClient.post('/auth/email/code', { email })
  } catch (error) {
    const code = getErrorCode(error)
    if (code === 'AUTH_40901') return { status: 'taken' }
    if (code === 'AUTH_42901') return { status: 'limit' }
    throw error
  }
  // 새 번호를 받으면 틀린 횟수 초기화
  verifyFailures.delete(email)
  return { status: 'ok', sentAt: Date.now() }
}

export type ResendResult = { status: 'ok'; sentAt: number } | { status: 'limit' }

// 인증 화면에선 이미 가입된 경우가 거의 없어 발송 불가로 같이 처리
export async function resendVerifyCode(email: string): Promise<ResendResult> {
  const result = await sendVerifyCode(email)
  return result.status === 'ok' ? result : { status: 'limit' }
}

export type VerifyResult =
  | { status: 'ok' }
  | { status: 'wrong'; failures: number }
  | { status: 'tooMany' }
  | { status: 'expired' }

// 서버는 5번 틀리면 번호를 무효로 함(AUTH_40001). 화면은 5번째에 바로 다시 받기 안내
export async function verifyEmailCode(email: string, code: string): Promise<VerifyResult> {
  try {
    await apiClient.post('/auth/email/verify', { email, code })
  } catch (error) {
    const errorCode = getErrorCode(error)
    if (errorCode === 'AUTH_40002') {
      const failures = (verifyFailures.get(email) ?? 0) + 1
      verifyFailures.set(email, failures)
      return failures >= VERIFY_MAX_FAILURES ? { status: 'tooMany' } : { status: 'wrong', failures }
    }
    if (errorCode === 'AUTH_40001') return { status: 'expired' }
    throw error
  }
  verifyFailures.delete(email)
  return { status: 'ok' }
}

// 재설정 링크는 30분, 한 번만 씀
const RESET_TTL_MS = 30 * 60 * 1000

// 메일 발송 연동 전이라 링크 토큰 고정. 마지막으로 요청한 이메일에 묶임
const resetTokens = new Map<string, { email: string; issuedAt: number }>()

// 가입 여부와 상관없이 같은 응답(계정 노출 방지). 이메일로 가입한 계정에만 링크 발급
export async function requestPasswordReset(email: string): Promise<void> {
  await wait(MOCK_DELAY_MS)
  const account = MOCK_ACCOUNTS.find((item) => item.email === email)
  if (account?.method === 'email') {
    resetTokens.set(MOCK_RESET_TOKEN, { email, issuedAt: Date.now() })
  }
}

export type ResetTokenResult = { status: 'ok'; email: string } | { status: 'expired' }

export async function checkResetToken(token: string): Promise<ResetTokenResult> {
  await wait(MOCK_DELAY_MS / 2)
  const issued = resetTokens.get(token)
  if (!issued || Date.now() - issued.issuedAt > RESET_TTL_MS) return { status: 'expired' }
  return { status: 'ok', email: issued.email }
}

export type ResetPasswordResult = { status: 'ok' } | { status: 'same' } | { status: 'expired' }

export async function resetPassword(token: string, password: string): Promise<ResetPasswordResult> {
  await wait(MOCK_DELAY_MS)
  const issued = resetTokens.get(token)
  if (!issued || Date.now() - issued.issuedAt > RESET_TTL_MS) return { status: 'expired' }

  const account = MOCK_ACCOUNTS.find((item) => item.email === issued.email)
  if (!account) return { status: 'expired' }
  if (account.password === password) return { status: 'same' }

  account.password = password
  resetTokens.delete(token)
  return { status: 'ok' }
}

export type ChangePasswordResult = { status: 'ok' } | { status: 'wrong' } | { status: 'same' }

// 마이 > 비밀번호 바꾸기. 이메일로 가입한 계정만
export async function changePassword(
  email: string,
  current: string,
  next: string,
): Promise<ChangePasswordResult> {
  await wait(MOCK_DELAY_MS)
  const account = MOCK_ACCOUNTS.find((item) => item.email === email)
  if (!account || account.password !== current) return { status: 'wrong' }
  if (current === next) return { status: 'same' }
  account.password = next
  return { status: 'ok' }
}

// 탈퇴할 때 커뮤니티 글·댓글을 지울지, '탈퇴한 회원'으로 남길지
export type CommunityPostsOnLeave = 'delete' | 'keep'

export async function deleteAccount(
  email: string | null,
  posts: CommunityPostsOnLeave,
): Promise<void> {
  await wait(MOCK_DELAY_MS)
  // 서버 연동 전이라 글 처리 방식은 받기만 함
  void posts
  const index = MOCK_ACCOUNTS.findIndex((item) => item.email === email)
  if (index >= 0) MOCK_ACCOUNTS.splice(index, 1)
}
