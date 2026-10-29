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

// 병원에서 들은 산후 검사 하나. 결과 메모를 적으면 끝난 검사
export type PostpartumCheck = {
  id: string
  name: string
  // YYYY-MM-DD
  date: string
  // 전날 저녁 · 당일 아침 알림
  remind: ('eve' | 'morning')[]
  memo: string | null
}

export type Profile = {
  name: string
  // YYYY-MM-DD. 모르면 null
  dueDate: string | null
  diagnosisDate: string | null
  careMode: CareMode
  // 병원에서 들은 연락 기준. 예: 같은 시점에 계속 높으면 외래로 전화
  contactMemo: string
  // 입원 중이면 측정 알림 멈춤
  hospitalized: boolean
  // YYYY-MM-DD. 있으면 산후 모드
  deliveryDate: string | null
  // YYYY-MM-DD. 산후 검사일을 이날 다시 물어봄
  checkRemindAt: string | null
  postpartumChecks: PostpartumCheck[]
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
      hospitalized: false,
      deliveryDate: null,
      checkRemindAt: null,
      postpartumChecks: [],
      updateProfile: (changes) => set(changes),
    }),
    { name: 'dangdang-profile' },
  ),
)
