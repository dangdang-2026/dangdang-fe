import { create } from 'zustand'

type SplashState = {
  // 앱을 열 때 스플래시가 덮고 있는지. 등장 애니메이션은 걷힌 뒤에 시작
  visible: boolean
  hide: () => void
}

export const useSplashStore = create<SplashState>()((set) => ({
  visible: true,
  hide: () => set({ visible: false }),
}))
