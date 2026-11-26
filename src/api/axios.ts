import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  isWithdrawing,
  leaveAfterSessionEnd,
  restartForConsent,
  unsubscribeDeviceOnly,
} from '@/utils/auth'
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

// 다른 탭과 차례로 재발급(같은 쿠키로 동시에 보내면 한쪽이 401)
const postRefresh = () =>
  navigator.locks
    ? navigator.locks.request('dangdang-refresh', () => apiClient.post(REFRESH_URL))
    : apiClient.post(REFRESH_URL)

// 재발급 서버 오류(5xx)가 3번 · 3분 넘게 끊김 없이 이어지면 로그인을 풂
const MAX_REFRESH_SERVER_FAILURES = 3
const REFRESH_OUTAGE_MS = 3 * 60 * 1000
// 실패 사이가 이만큼 벌어지면 새로 셈(이어진 장애로 안 봄)
const OUTAGE_GAP_MS = 60 * 1000
let refreshServerFailures = 0
let firstServerFailureAt = 0
let lastServerFailureAt = 0

const refreshOutageTooLong = () =>
  refreshServerFailures >= MAX_REFRESH_SERVER_FAILURES &&
  Date.now() - firstServerFailureAt >= REFRESH_OUTAGE_MS

// 같이 기다린 요청이 여럿이어도 재발급 한 번에 한 번만 셈
function refreshToken() {
  refreshing ??= postRefresh()
    .then(() => {
      refreshServerFailures = 0
    })
    .catch((error: unknown) => {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined
      const now = Date.now()
      if (status === undefined || status < 500) {
        // 서버 오류가 아니면 이어진 장애가 아님
        refreshServerFailures = 0
      } else {
        if (refreshServerFailures === 0 || now - lastServerFailureAt > OUTAGE_GAP_MS) {
          refreshServerFailures = 0
          firstServerFailureAt = now
        }
        refreshServerFailures += 1
        lastServerFailureAt = now
      }
      throw error
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

type SessionState = 'alive' | 'ended' | 'unknown'

// 다른 탭 재발급 쿠키가 들어올 틈. 이만큼 기다렸다 한 번 더 봄
const SESSION_RECHECK_MS = 1000

// 내 정보로 세션 확인. 401만 끝남, 끊김 · 서버 오류는 모름
const probeSession = (): Promise<SessionState> =>
  apiClient
    .get('/me', { retried: true } as AxiosRequestConfig)
    .then(() => 'alive' as const)
    .catch((error: unknown) =>
      axios.isAxiosError(error) && error.response?.status === 401 ? 'ended' : 'unknown',
    )

// 세션이 정말 끝났는지 두 번 확인. 기다리는 요청이 여럿이어도 한 번만
let checkingSession: Promise<SessionState> | null = null
function checkSession() {
  checkingSession ??= probeSession()
    .then(async (first) => {
      if (first !== 'ended') return first
      await new Promise((resolve) => window.setTimeout(resolve, SESSION_RECHECK_MS))
      return probeSession()
    })
    .finally(() => {
      checkingSession = null
    })
  return checkingSession
}

let signingOut = false

// 세션이 끝나면 로그인 풀고 시작 화면으로(탈퇴 중엔 그쪽에 맡김)
async function signOutOnDevice() {
  if (signingOut || isWithdrawing() || !useAuthStore.getState().account) return
  signingOut = true
  clearPendingKakao()
  // 쿠키가 끝나 기기 구독만 끊음
  await unsubscribeDeviceOnly()
  // 새로 열기 직전에 풂
  useAuthStore.getState().logout()
  leaveAfterSessionEnd()
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
    // 재발급 요청은 다시 재발급 안 함(자기 자신을 기다려 멈춤)
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
        const session = await checkSession()
        if (session === 'alive') return apiClient(config)
        if (session === 'ended') void signOutOnDevice()
      } else if (refreshOutageTooLong()) {
        // 서버 오류가 오래 이어지면 다시 로그인하게
        void signOutOnDevice()
      }
      throw error
    }
    return apiClient(config)
  },
)
