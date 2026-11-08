import axios from 'axios'

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
