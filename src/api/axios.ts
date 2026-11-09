import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/useAuthStore'

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

// 서버가 보낸 에러 문구. 응답이 없으면 undefined
export function getErrorMessage(error: unknown) {
  if (!axios.isAxiosError<BaseResponse<unknown>>(error)) return undefined
  return error.response?.data?.message
}

// 만료(40102) 외에 쿠키 수명(30분)이 끝나 토큰이 아예 없을 때(40101)도 재발급 시도
const REFRESH_CODES = ['AUTH_40101', 'AUTH_40102']

// Refresh 토큰은 한 번 쓰면 버려져서 동시에 만료된 요청들이 재발급 하나를 같이 기다림
let refreshing: Promise<void> | null = null

function refreshToken() {
  refreshing ??= apiClient
    .post('/auth/refresh')
    .then(() => undefined)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = (axios.isAxiosError(error) ? error.config : undefined) as
      (InternalAxiosRequestConfig & { retried?: boolean }) | undefined
    if (!config || config.retried || !REFRESH_CODES.includes(getErrorCode(error) ?? '')) {
      throw error
    }

    // 다시 보낸 요청이 또 401이면 반복하지 않음
    config.retried = true
    try {
      await refreshToken()
    } catch {
      // Refresh도 만료·사용됨(40103)이면 로그인 풂. OnboardingGate가 시작 화면으로 보냄
      useAuthStore.getState().logout()
      throw error
    }
    return apiClient(config)
  },
)
