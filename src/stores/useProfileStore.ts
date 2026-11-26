import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getErrorCode } from '@/api/axios'
import {
  createPostpartumTest,
  deletePostpartumTest,
  getPostpartumHome,
  getPostpartumTests,
  remindLater,
  updatePostpartumTest,
  updatePostpartumTestResult,
} from '@/api/postpartum'
import {
  graduate,
  updateDeliveryDate,
  updateHospitalization,
  updateMeasurementPause,
  undoDeliveryDate,
  type PregnancyState,
} from '@/api/pregnancy'
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
  // 다른 상황이에요를 골라 측정 알림만 멈춤(서버 PAUSED)
  paused: boolean
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
      paused: false,
      deliveryDate: null,
      checkRemindAt: null,
      postpartumChecks: [],
      updateProfile: (changes) => set(changes),
    }),
    { name: 'dangdang-profile' },
  ),
)

// 서버에 입원 상태를 저장한 뒤 기기에 반영. 다시 켜기인데 서버가 이미 입원 중이 아니면(409) 그대로 끔
export async function saveHospitalized(hospitalized: boolean) {
  try {
    await updateHospitalization(hospitalized)
  } catch (error) {
    if (hospitalized || getErrorCode(error) !== 'PREGNANCY_40901') throw error
  }
  useProfileStore.getState().updateProfile({ hospitalized })
}

// 다른 상황이에요 · 다시 켜기를 서버에 저장한 뒤 기기에 반영. 다시 켜기인데 서버가 멈춘 상태가 아니면(409) 그대로 끔
export async function savePaused(paused: boolean) {
  try {
    await updateMeasurementPause(paused)
  } catch (error) {
    if (paused || getErrorCode(error) !== 'PREGNANCY_40901') throw error
  }
  useProfileStore.getState().updateProfile({ paused })
}

// 산후 홈(출산일 · 다시 물어볼 날)과 검사 목록(지난 검사 포함)을 기기에 반영. 산후가 아니면 409
export async function syncPostpartumHome() {
  const [home, checks] = await Promise.all([getPostpartumHome(), getPostpartumTests()])
  useProfileStore.getState().updateProfile({
    deliveryDate: home.deliveryDate,
    checkRemindAt: home.askOn,
    postpartumChecks: checks,
  })
}

// 서버 임신 상태로 산후 모드를 맞춤. 산후면 산후 홈을 받고, 아니면 비움
export async function syncPostpartum(pregnancyState: PregnancyState | null) {
  if (pregnancyState === 'POSTPARTUM') return syncPostpartumHome()
  useProfileStore
    .getState()
    .updateProfile({ deliveryDate: null, checkRemindAt: null, postpartumChecks: [] })
}

type CheckInput = Pick<PostpartumCheck, 'name' | 'date' | 'remind'>

// 서버에 검사 일정을 등록(id 없음) · 수정한 뒤 기기에 반영. 날짜를 적었으니 다시 물어보지 않음
export async function savePostpartumCheck(input: CheckInput, id?: string) {
  const saved = id ? await updatePostpartumTest(id, input) : await createPostpartumTest(input)
  const { postpartumChecks, updateProfile } = useProfileStore.getState()
  updateProfile({
    postpartumChecks: id
      ? postpartumChecks.map((item) => (item.id === id ? saved : item))
      : [...postpartumChecks, saved],
    checkRemindAt: null,
  })
}

// 서버에 결과 메모를 저장한 뒤 기기에 반영
export async function savePostpartumCheckResult(id: string, memo: string) {
  const saved = await updatePostpartumTestResult(id, memo)
  const { postpartumChecks, updateProfile } = useProfileStore.getState()
  updateProfile({
    postpartumChecks: postpartumChecks.map((item) => (item.id === id ? saved : item)),
  })
}

// 서버에 다시 물어볼 날을 저장한 뒤 기기에 반영
export async function saveRemindLater(remindOn: string) {
  const saved = await remindLater(remindOn)
  useProfileStore.getState().updateProfile({ checkRemindAt: saved })
}

// 서버에 출산일을 저장한 뒤 산후 모드로. 입원 · 다시 물어볼 날은 초기화
export async function saveDeliveryDate(deliveryDate: string) {
  const saved = await updateDeliveryDate(deliveryDate)
  useProfileStore.getState().updateProfile({
    deliveryDate: saved.deliveryDate ?? deliveryDate,
    hospitalized: false,
    paused: false,
    checkRemindAt: null,
  })
}

// 서버에서 출산을 되돌린 뒤 임신 중 홈으로. 이미 산후가 아니면(409) 그대로 비움
export async function undoDelivery() {
  try {
    await undoDeliveryDate()
  } catch (error) {
    if (getErrorCode(error) !== 'PREGNANCY_40901') throw error
  }
  useProfileStore
    .getState()
    .updateProfile({ deliveryDate: null, checkRemindAt: null, postpartumChecks: [] })
}

// 서버에서 졸업한 뒤 기기의 산후 모드를 비움. 졸업 화면 숫자를 돌려줌
export async function graduatePostpartum() {
  const stats = await graduate()
  useProfileStore
    .getState()
    .updateProfile({ deliveryDate: null, checkRemindAt: null, postpartumChecks: [] })
  return stats
}

// 서버에서 검사 일정을 지운 뒤 기기에서도 뺌. 이미 없는 일정(404)이면 그대로 뺌
export async function deletePostpartumCheck(id: string) {
  try {
    await deletePostpartumTest(id)
  } catch (error) {
    if (getErrorCode(error) !== 'POSTPARTUM_40401') throw error
  }
  const { postpartumChecks, updateProfile } = useProfileStore.getState()
  updateProfile({ postpartumChecks: postpartumChecks.filter((item) => item.id !== id) })
}
