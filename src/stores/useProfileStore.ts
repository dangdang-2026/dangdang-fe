import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MOCK_USER } from '@/mocks/user'

// 관리 모드: 식사·운동 / 인슐린 함께 / 먹는 약 함께
export type CareMode = 'diet' | 'insulin' | 'oral'

export type Profile = {
  name: string
  // YYYY-MM-DD. 모르면 null
  dueDate: string | null
  diagnosisDate: string | null
  careMode: CareMode
}

type ProfileState = Profile & {
  updateProfile: (changes: Partial<Profile>) => void
}

// 가입(온보딩) 연동 전까지 기기에 저장
export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      name: MOCK_USER.name,
      dueDate: null,
      diagnosisDate: null,
      careMode: 'diet',
      updateProfile: (changes) => set(changes),
    }),
    { name: 'dangdang-profile' },
  ),
)
