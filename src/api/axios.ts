import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/useAuthStore'
import { restartForConsent } from '@/utils/auth'
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

function refreshToken() {
  refreshing ??= apiClient
    .post(REFRESH_URL)
    .then(() => undefined)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

// 세션이 끝나 로그인을 풂. 마이 로그아웃처럼 이 기기 푸시 구독 · 카카오 대기 토큰도 정리. OnboardingGate가 시작 화면으로 보냄
function signOutOnDevice() {
  if (!useAuthStore.getState().account) return
  useAuthStore.getState().logout()
  clearPendingKakao()
  // 쿠키가 끝나 서버 구독 삭제는 못 함(다시 재발급을 부름). 기기 구독만 끊으면 서버가 보낼 때 정리됨
  void import('@/api/push')
    .then(({ unsubscribePush }) => unsubscribePush({ server: false }))
    .catch(() => {})
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
      // 재발급도 만료 · 사용됨(401)일 때만 로그인 풂. 끊김 · 서버 오류면 로그인 유지
      if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401) {
        signOutOnDevice()
      }
      throw error
    }
    return apiClient(config)
  },
)
