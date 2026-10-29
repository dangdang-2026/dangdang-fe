import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_HOSPITAL } from '@/mocks/hospital'
import type { Hospital, HospitalInfo } from '@/types/hospital'

type HospitalInput = Omit<Hospital, 'id'>

type HospitalState = {
  // 첫 번째가 대표 병원
  hospitals: Hospital[]
  addHospital: (input: HospitalInput) => Hospital
  updateHospital: (id: string, input: HospitalInput) => void
  removeHospital: (id: string) => void
  // 병원 찾기에서 고른 병원. 목록 화면이 받아서 추가 시트를 엶
  draft: { info: HospitalInfo; manual: boolean } | null
  setDraft: (draft: { info: HospitalInfo; manual: boolean } | null) => void
}

// API 연동 전까지 기기(localStorage)에 저장
export const useHospitalStore = create<HospitalState>()(
  persist(
    (set) => ({
      hospitals: [DEFAULT_HOSPITAL],
      addHospital: (input) => {
        const hospital = { ...input, id: crypto.randomUUID() }
        set((state) => ({ hospitals: [...state.hospitals, hospital] }))
        return hospital
      },
      updateHospital: (id, input) =>
        set((state) => ({
          hospitals: state.hospitals.map((item) => (item.id === id ? { ...input, id } : item)),
        })),
      removeHospital: (id) =>
        set((state) => ({ hospitals: state.hospitals.filter((item) => item.id !== id) })),
      draft: null,
      setDraft: (draft) => set({ draft }),
    }),
    { name: 'dangdang-hospital', partialize: (state) => ({ hospitals: state.hospitals }) },
  ),
)
