import type { LoginMethod } from '@/stores/useAuthStore'
import { addDays, toDateKey } from '@/utils/date'

// 로그인하면 기기에 넣는 계정 정보. 날짜는 오늘 기준이라 언제 열어도 같은 주수
export type AccountProfile = {
  name: string
  // YYYY-MM-DD
  dueDate: string | null
  // YYYY-MM-DD. 있으면 산후 모드
  deliveryDate: string | null
}

type MockAccount = {
  email: string
  method: LoginMethod
  // 카카오로 가입한 계정은 비밀번호 없음
  password?: string
  profile?: AccountProfile
}

const daysFromToday = (days: number) => toDateKey(addDays(new Date(), days))

// 서버 로그인 연동 전 임시 계정. 출산 전(다현) · 출산 후(승민) 데모
export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    email: 'dahyun@gmail.com',
    method: 'email',
    password: 'dang2026',
    // 임신 26주 1일
    profile: { name: '다현', dueDate: daysFromToday(97), deliveryDate: null },
  },
  {
    email: 'seungmin@gmail.com',
    method: 'email',
    password: 'dang2026',
    // 예정일보다 일주일 빨리 낳아 출산 3주
    profile: { name: '승민', dueDate: daysFromToday(-14), deliveryDate: daysFromToday(-21) },
  },
  { email: 'kakao@kakao.com', method: 'kakao' },
]

// 메일 발송 연동 전이라 인증번호 고정
export const MOCK_VERIFY_CODE = '482915'

// 재설정 메일 링크 대신 /password/reset?token=dangdang-reset 으로 열기
export const MOCK_RESET_TOKEN = 'dangdang-reset'
