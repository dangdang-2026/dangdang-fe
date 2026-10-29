import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type LoginMethod = 'email' | 'kakao'

type AuthState = {
  // 로그인 화면 '최근 로그인' 표시용
  lastMethod: LoginMethod | null
  setLastMethod: (method: LoginMethod) => void
}

// 서버 로그인 연동 전까지 기기에 저장
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      lastMethod: null,
      setLastMethod: (method) => set({ lastMethod: method }),
    }),
    { name: 'dangdang-auth' },
  ),
)
