import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/useAuthStore'
import { leaveAfterLogout, restartForConsent, unsubscribeDeviceOnly } from '@/utils/auth'
import { clearPendingKakao } from '@/utils/kakaoPending'

// 서버 공통 응답. 실패면 errorCode가 붙음
export type BaseResponse<T> = {
  success: boolean
  code: number
  message: string
  errorCode?: string
  data?: T
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  // 로그인 토큰이 httpOnly 쿠키라 요청마다 함께 보냄
  withCredentials: true,
})

// 서버가 보낸 에러 코드(AUTH_40002 등). 응답이 없으면 null
export function getErrorCode(error: unknown) {
  if (!axios.isAxiosError<BaseResponse<unknown>>(error)) return null
  return error.response?.data?.errorCode ?? null
}

// 실패 응답에 함께 온 값. 예: 로그인 실패 { remainingAttempts }, 잠금 · 다시 받기 대기 { retryAfterSeconds }
export function getErrorData<T>(error: unknown): Partial<T> | null {
  if (!axios.isAxiosError<BaseResponse<T>>(error)) return null
  return error.response?.data?.data ?? null
}

// 서버가 보낸 에러 문구. 응답이 없으면 undefined
export function getErrorMessage(error: unknown) {
  if (!axios.isAxiosError<BaseResponse<unknown>>(error)) return undefined
  return error.response?.data?.message
}

// 만료(40102) 외에 쿠키 수명(30분)이 끝나 토큰이 아예 없을 때(40101)도 재발급 시도
const REFRESH_CODES = ['AUTH_40101', 'AUTH_40102']

// Refresh 토큰은 한 번 쓰면 버려져서 동시에 만료된 요청들이 재발급 하나를 같이 기다림
let refreshing: Promise<void> | null = null

const REFRESH_URL = '/auth/refresh'

// 다른 탭과도 차례로 재발급. 같은 refresh 쿠키로 동시에 보내 한쪽이 401을 받지 않게
const postRefresh = () =>
  navigator.locks
    ? navigator.locks.request('dangdang-refresh', () => apiClient.post(REFRESH_URL))
    : apiClient.post(REFRESH_URL)

// 재발급이 서버 오류로 연달아 실패한 횟수. 이만큼이면 복구할 길이 없어 로그인을 풂(끊김은 세지 않음)
const MAX_REFRESH_SERVER_FAILURES = 3
let refreshServerFailures = 0

// 같이 기다린 요청이 여럿이어도 재발급 한 번에 한 번만 셈
function refreshToken() {
  refreshing ??= postRefresh()
    .then(() => {
      refreshServerFailures = 0
    })
    .catch((error: unknown) => {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined
      if (status !== undefined && status >= 500) refreshServerFailures += 1
      throw error
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

// 세션이 끝났는지 한 번 더 확인. 다른 탭이 먼저 재발급했으면 쿠키가 새로 바뀌어 통과
async function sessionStillAlive() {
  try {
    await apiClient.get('/me', { retried: true } as AxiosRequestConfig)
    return true
  } catch {
    return false
  }
}

let signingOut = false

// 세션이 끝나면 마이 로그아웃처럼 정리하고 시작 화면으로
async function signOutOnDevice() {
  if (signingOut || !useAuthStore.getState().account) return
  signingOut = true
  useAuthStore.getState().logout()
  clearPendingKakao()
  // 서버 구독 삭제는 쿠키가 끝나 못 함. 기기 구독만 끊으면 서버가 보낼 때 정리됨
  await unsubscribeDeviceOnly()
  // 이 계정 기록을 지우고 다른 탭에도 알림
  leaveAfterLogout()
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = (axios.isAxiosError(error) ? error.config : undefined) as
      (InternalAxiosRequestConfig & { retried?: boolean }) | undefined
    // 건강정보 동의가 없어 저장 · 당당이가 막히면(USER_40302) 가입 동의 화면으로
    if (getErrorCode(error) === 'USER_40302') {
      restartForConsent()
      throw error
    }
    // 재발급 요청 자체는 다시 재발급하지 않음(자기 자신을 기다려 멈추지 않게)
    if (
      !config ||
      config.retried ||
      config.url === REFRESH_URL ||
      !REFRESH_CODES.includes(getErrorCode(error) ?? '')
    ) {
      throw error
    }

    // 다시 보낸 요청이 또 401이면 반복하지 않음
    config.retried = true
    try {
      await refreshToken()
    } catch (refreshError) {
      const status = axios.isAxiosError(refreshError) ? refreshError.response?.status : undefined
      // 만료 · 사용됨(401)이어도 다른 탭이 먼저 재발급했을 수 있어 한 번 더 확인
      if (status === 401) {
        if (await sessionStillAlive()) return apiClient(config)
        void signOutOnDevice()
      } else if (refreshServerFailures >= MAX_REFRESH_SERVER_FAILURES) {
        // 서버 오류가 계속되면 로그인을 풀어 다시 로그인하게. 끊김(응답 없음)이면 로그인 유지
        void signOutOnDevice()
      }
      throw error
    }
    return apiClient(config)
  },
)
