import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getErrorCode } from '@/api/axios'
import {
  createCareSite,
  deleteCareSite,
  getCareSites,
  setPrimaryCareSite,
  updateCareSite,
} from '@/api/careSites'
import type { Hospital, HospitalInfo } from '@/types/hospital'

export type HospitalInput = Omit<Hospital, 'id'>

// 다른 기기에서 이미 지웠거나 없는 병원
const NOT_FOUND = 'CARE_SITE_40401'

// 고치려던 병원이 서버에 없음
export class HospitalGoneError extends Error {}

type HospitalState = {
  // 첫 번째가 대표 병원
  hospitals: Hospital[]
  updateHospital: (id: string, input: HospitalInput) => void
  // 병원 찾기에서 고른 병원. 목록 화면이 받아서 추가 시트를 엶
  draft: { info: HospitalInfo; manual: boolean } | null
  setDraft: (draft: { info: HospitalInfo; manual: boolean } | null) => void
}

// 서버 병원 목록을 받아 기기에도 저장. 오프라인에서도 마지막 목록을 보여 줌
export const useHospitalStore = create<HospitalState>()(
  persist(
    (set) => ({
      hospitals: [],
      updateHospital: (id, input) =>
        set((state) => ({
          hospitals: state.hospitals.map((item) => (item.id === id ? { ...input, id } : item)),
        })),
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
    // 되돌리기를 기다리는 병원은 다시 넣지 않음
    hospitals: hospitals
      .filter((hospital) => !pendingDeletes.has(hospital.id))
      .map((hospital) => {
        const prev = local.find((item) => item.id === hospital.id)
        return prev ? { ...hospital, kind: prev.kind, nextVisitAt: prev.nextVisitAt } : hospital
      }),
  })
}

// 서버에 등록한 뒤 목록 끝에 추가. 첫 병원은 대표 병원. 서버에 없는 종류·다음 진료일은 기기에
export async function saveNewHospital(input: HospitalInput) {
  const primary = useHospitalStore.getState().hospitals.length === 0
  const saved = await createCareSite(input, primary)
  const hospital = { ...saved, kind: input.kind, nextVisitAt: input.nextVisitAt }
  useHospitalStore.setState((state) => ({ hospitals: [...state.hospitals, hospital] }))
  return hospital
}

// 화면엔 바로 고치고 서버에 저장. 실패하면 원래 정보로 되돌림
export async function saveHospitalEdit(id: string, input: HospitalInput) {
  const { hospitals, updateHospital } = useHospitalStore.getState()
  const previous = hospitals.find((item) => item.id === id)
  if (!previous) return
  updateHospital(id, input)
  try {
    await updateCareSite(id, input)
  } catch (error) {
    // 이미 지운 병원이면 목록에서 빼고 서버 목록으로 다시 맞춤
    if (getErrorCode(error) === NOT_FOUND) {
      useHospitalStore.setState((state) => ({
        hospitals: state.hospitals.filter((item) => item.id !== id),
      }))
      await syncHospitals().catch(() => {})
      throw new HospitalGoneError()
    }
    updateHospital(id, previous)
    throw error
  }
}

// 되돌리기 토스트(4초)가 닫힌 뒤 서버에서 지움. 서버에 되살리기가 없어서 그때까지 기다림
export const HOSPITAL_UNDO_MS = 4500

// 되돌리기를 기다리거나 서버에서 지우는 중인 병원. 지운 자리를 기억해 되돌리면 원래 자리로
const pendingDeletes = new Map<
  string,
  { hospital: Hospital; index: number; timer: number; callbacks: DeleteCallbacks; sending: boolean }
>()

type DeleteCallbacks = {
  // 서버에서 지움. 대표 병원이었으면 다음 병원이 대표
  onDeleted: (wasPrimary: boolean, nextPrimary: Hospital | undefined) => void
  onFailed: () => void
}

// 화면에서 먼저 빼고 몇 초 뒤 서버에서 지움. 돌려준 함수로 되돌림(이미 보냈으면 false)
export function deleteHospitalLater(id: string, callbacks: DeleteCallbacks) {
  const { hospitals } = useHospitalStore.getState()
  const index = hospitals.findIndex((item) => item.id === id)
  const hospital = hospitals[index]
  if (!hospital || pendingDeletes.has(id)) return () => false
  useHospitalStore.setState({ hospitals: hospitals.filter((item) => item.id !== id) })
  const timer = window.setTimeout(() => void commitDelete(id), HOSPITAL_UNDO_MS)
  pendingDeletes.set(id, { hospital, index, timer, callbacks, sending: false })
  return () => {
    const pending = pendingDeletes.get(id)
    // 서버에 이미 보냈으면 되돌릴 수 없음
    if (!pending || pending.sending) return false
    window.clearTimeout(pending.timer)
    pendingDeletes.delete(id)
    restoreHospital(pending.hospital, pending.index)
    return true
  }
}

// 앱을 닫거나 내리기 전에 기다리던 지우기를 바로 보냄(다음에 켤 때 지운 병원이 돌아오지 않게)
export function flushHospitalDeletes() {
  pendingDeletes.forEach((pending, id) => {
    if (pending.sending) return
    window.clearTimeout(pending.timer)
    void commitDelete(id)
  })
}

// 되돌린 병원이 첫 자리면 서버에서도 대표로(그사이 다른 대표 지우기로 서버 대표가 바뀌었을 수 있음)
function restoreHospital(hospital: Hospital, index: number) {
  let restoredAt = -1
  useHospitalStore.setState((state) => {
    if (state.hospitals.some((item) => item.id === hospital.id)) return state
    const hospitals = [...state.hospitals]
    restoredAt = Math.min(index, hospitals.length)
    hospitals.splice(restoredAt, 0, hospital)
    return { hospitals }
  })
  if (restoredAt === 0) void setPrimaryCareSite(hospital.id).catch(() => {})
}

async function commitDelete(id: string) {
  const pending = pendingDeletes.get(id)
  if (!pending || pending.sending) return
  pending.sending = true
  const { hospital, index, callbacks } = pending
  try {
    await deleteCareSite(hospital.id)
  } catch (error) {
    // 이미 지운 병원이면 지운 걸로 봄. 아니면 원래 자리로
    if (getErrorCode(error) !== NOT_FOUND) {
      pendingDeletes.delete(id)
      restoreHospital(hospital, index)
      callbacks.onFailed()
      return
    }
  } finally {
    // 지우는 중에 목록을 다시 받아도 안 돌아오게, 끝날 때까지 남겨 둠
    if (pendingDeletes.get(id) === pending) pendingDeletes.delete(id)
  }
  // 대표 병원을 지우면 지금 첫 병원을 서버에서도 대표로. 실패해도 앱은 첫 병원을 대표로 씀
  const wasPrimary = index === 0
  const next = wasPrimary ? useHospitalStore.getState().hospitals[0] : undefined
  if (next) await setPrimaryCareSite(next.id).catch(() => {})
  callbacks.onDeleted(wasPrimary, next)
}

// 앱을 내리거나 닫을 때 기다리던 병원 지우기를 바로 보냄
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushHospitalDeletes)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushHospitalDeletes()
  })
}
