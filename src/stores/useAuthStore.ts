import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type LoginMethod = 'email' | 'kakao'

// 로그인한 계정. 카카오는 이메일을 모를 수 있음
export type AuthAccount = {
  method: LoginMethod
  email: string | null
}

type AuthState = {
  account: AuthAccount | null
  // 로그인 화면 '최근 로그인' 표시용. 로그아웃해도 남김
  lastMethod: LoginMethod | null
  // 이메일로 로그인했는데 카카오가 안 연결돼 있으면 오늘 화면에서 한 번 연결 권함
  kakaoLinkOffer: boolean
  login: (account: AuthAccount) => void
  setKakaoLinkOffer: (offer: boolean) => void
  logout: () => void
}

// 서버 로그인 연동 전까지 기기에 저장
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      account: null,
      lastMethod: null,
      kakaoLinkOffer: false,
      login: (account) => set({ account, lastMethod: account.method }),
      setKakaoLinkOffer: (kakaoLinkOffer) => set({ kakaoLinkOffer }),
      logout: () => set({ account: null, kakaoLinkOffer: false }),
    }),
    { name: 'dangdang-auth' },
  ),
)
