import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCareSites } from '@/api/careSites'
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

// 서버 병원 목록을 받아 기기에도 저장. 오프라인에서도 마지막 목록을 보여 줌
export const useHospitalStore = create<HospitalState>()(
  persist(
    (set) => ({
      hospitals: [],
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

// 서버 병원 목록으로 바꿈. 서버에 없는 병원 종류·다음 진료일은 기기 값을 이어 씀
export async function syncHospitals() {
  const hospitals = await getCareSites()
  const local = useHospitalStore.getState().hospitals
  useHospitalStore.setState({
    hospitals: hospitals.map((hospital) => {
      const prev = local.find((item) => item.id === hospital.id)
      return prev ? { ...hospital, kind: prev.kind, nextVisitAt: prev.nextVisitAt } : hospital
    }),
  })
}
