import { MOCK_ACCOUNTS } from '@/mocks/auth'

// 연속으로 틀리면 잠깐 잠금. 횟수·시간은 서버 정책 값
export const LOGIN_MAX_FAILURES = 5
const LOCK_MS = 10 * 60 * 1000
const MOCK_DELAY_MS = 800

export type EmailLoginResult =
  | { status: 'ok' }
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
    return { status: 'ok' }
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
