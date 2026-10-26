import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MOCK_USER } from '@/mocks/user'

// 관리 모드: 식사·운동 / 인슐린 함께 / 먹는 약 함께
export type CareMode = 'diet' | 'insulin' | 'oral'
export const CARE_MODE_LABEL: Record<CareMode, string> = {
  diet: '식이 관리',
  insulin: '인슐린 함께',
  oral: '먹는 약 함께',
}

export type Profile = {
  name: string
  // YYYY-MM-DD. 모르면 null
  dueDate: string | null
  diagnosisDate: string | null
  careMode: CareMode
  // 병원에서 들은 연락 기준. 예: 같은 시점에 계속 높으면 외래로 전화
  contactMemo: string
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
      contactMemo: '',
      updateProfile: (changes) => set(changes),
    }),
    { name: 'dangdang-profile' },
  ),
)
