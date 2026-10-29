import type { LoginMethod } from '@/stores/useAuthStore'

type MockAccount = {
  email: string
  method: LoginMethod
  // 카카오로 가입한 계정은 비밀번호 없음
  password?: string
}

// 서버 로그인 연동 전 임시 계정
export const MOCK_ACCOUNTS: MockAccount[] = [
  { email: 'dahyun@gmail.com', method: 'email', password: 'dang2026' },
  { email: 'kakao@kakao.com', method: 'kakao' },
]

// 메일 발송 연동 전이라 인증번호 고정
export const MOCK_VERIFY_CODE = '482915'

// 재설정 메일 링크 대신 /password/reset?token=dangdang-reset 으로 열기
export const MOCK_RESET_TOKEN = 'dangdang-reset'
