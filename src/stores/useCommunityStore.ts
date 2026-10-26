import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MOCK_POSTS } from '@/mocks/community'
import type { Post } from '@/types/community'

type CommunityState = {
  // 커뮤니티 첫 진입에 정함. 안 정했으면 null
  nickname: string | null
  posts: Post[]
  // 메인 안내 띠를 닫았는지
  noticeDismissed: boolean
  dismissNotice: () => void
}

// API 연동 전까지 mock 글로 시작해 기기에 저장
export const useCommunityStore = create<CommunityState>()(
  persist(
    (set) => ({
      nickname: null,
      posts: MOCK_POSTS,
      noticeDismissed: false,
      dismissNotice: () => set({ noticeDismissed: true }),
    }),
    { name: 'dangdang-community' },
  ),
)
