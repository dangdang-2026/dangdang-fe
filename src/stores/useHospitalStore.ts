import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_HOSPITAL } from '@/mocks/hospital'
import type { Hospital } from '@/types/hospital'

type HospitalInput = Omit<Hospital, 'id'>

type HospitalState = {
  // 첫 번째가 대표 병원
  hospitals: Hospital[]
  addHospital: (input: HospitalInput) => Hospital
  updateHospital: (id: string, input: HospitalInput) => void
  removeHospital: (id: string) => void
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
    }),
    { name: 'dangdang-hospital' },
  ),
)
