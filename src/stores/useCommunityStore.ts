import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MOCK_POSTS } from '@/mocks/community'
import type { Post } from '@/types/community'

type CommunityState = {
  // 커뮤니티 첫 진입에 정함. 안 정했으면 null
  nickname: string | null
  // 글·댓글 옆에 임신 주수 배지
  showWeek: boolean
  posts: Post[]
  // 메인 안내 띠를 닫았는지
  noticeDismissed: boolean
  setNickname: (nickname: string, showWeek?: boolean) => void
  dismissNotice: () => void
}

// API 연동 전까지 mock 글로 시작해 기기에 저장
export const useCommunityStore = create<CommunityState>()(
  persist(
    (set) => ({
      nickname: null,
      showWeek: false,
      posts: MOCK_POSTS,
      noticeDismissed: false,
      setNickname: (nickname, showWeek) =>
        set((state) => ({ nickname, showWeek: showWeek ?? state.showWeek })),
      dismissNotice: () => set({ noticeDismissed: true }),
    }),
    { name: 'dangdang-community' },
  ),
)
