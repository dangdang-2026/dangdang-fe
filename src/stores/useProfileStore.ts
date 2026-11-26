import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getErrorCode } from '@/api/axios'
import {
  toCareProfile,
  updateCareMode,
  updateContactMemo,
  updateDiagnosisDate,
  type Me,
} from '@/api/me'
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
  // 검사 받는 곳. 안 적었으면 null
  place: string | null
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
  // 기기에 먼저 적어 둔 관리 정보를 서버로 한 번 올린 계정
  careSyncedUserId: number | null
}

type ProfileState = Profile & {
  updateProfile: (changes: Partial<Profile>) => void
}

// 가입(온보딩) 연동 전까지 기기에 저장
export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      // 로그인하면 /me 이름으로 채움
      name: '',
      dueDate: null,
      diagnosisDate: null,
      careMode: 'diet',
      contactMemo: '',
      hospitalized: false,
      paused: false,
      deliveryDate: null,
      checkRemindAt: null,
      postpartumChecks: [],
      careSyncedUserId: null,
      updateProfile: (changes) => set(changes),
    }),
    { name: 'dangdang-profile' },
  ),
)

// /me의 관리 정보를 기기에 반영. 서버가 비어 있고 이 기기에 이 계정이 먼저 적어 둔 값이 있으면 처음 한 번만 서버로 올림
// 끊김 · 서버 오류(5xx)면 다음에 다시 올림. 서버가 거절(4xx)하면 그 뒤로는 서버 값을 따름
const shouldRetry = (error: unknown) => {
  const code = getErrorCode(error)
  return !code || /_5[0-9]{4}$/.test(code)
}

export async function syncCareProfile(me: Me, ownsLegacy: boolean) {
  if (!me.careMode) return
  const local = useProfileStore.getState()
  const next = toCareProfile({
    diagnosisDate: me.diagnosisDate ?? null,
    careMode: me.careMode,
    contactMemo: me.contactMemo ?? null,
    contactMemoUpdatedAt: me.contactMemoUpdatedAt ?? null,
  })
  const uploads: Promise<unknown>[] = []
  // 서버 연동 전 기기에 적어 둔 값(올린 계정 없음)이 이 계정 것일 때만
  if (ownsLegacy && local.careSyncedUserId === null) {
    if (!next.diagnosisDate && local.diagnosisDate) {
      next.diagnosisDate = local.diagnosisDate
      uploads.push(updateDiagnosisDate(local.diagnosisDate))
    }
    if (next.careMode === 'diet' && local.careMode !== 'diet') {
      next.careMode = local.careMode
      uploads.push(updateCareMode(local.careMode))
    }
    if (!next.contactMemo && local.contactMemo) {
      next.contactMemo = local.contactMemo
      uploads.push(updateContactMemo(local.contactMemo))
    }
  }
  local.updateProfile(next)
  // 다 올린 뒤에만 올린 계정을 적음. 못 올리면 기기 값을 두고 다음에 다시
  const results = await Promise.allSettled(uploads)
  if (results.some((result) => result.status === 'rejected' && shouldRetry(result.reason))) return
  useProfileStore.getState().updateProfile({ careSyncedUserId: me.userId })
}

type CareKey = 'diagnosisDate' | 'careMode' | 'contactMemo'

// 칸마다 저장 순서 · 서버가 마지막으로 받아 준 값. 겹친 저장이 실패해도 확정 안 된 값으로 되돌리지 않게
const careSaves: Record<
  CareKey,
  { seq: number; pending: number; confirmed: unknown; latestFailed: boolean }
> = {
  diagnosisDate: { seq: 0, pending: 0, confirmed: null, latestFailed: false },
  careMode: { seq: 0, pending: 0, confirmed: null, latestFailed: false },
  contactMemo: { seq: 0, pending: 0, confirmed: null, latestFailed: false },
}

// 화면엔 바로 바꾸고 서버에 저장. 가장 마지막 요청 응답만 반영, 마지막이 실패하면 다 끝난 뒤 확정값으로 되돌림
async function saveCareField<K extends CareKey>(
  key: K,
  value: Profile[K],
  request: () => Promise<Pick<Profile, CareKey>>,
) {
  const { updateProfile } = useProfileStore.getState()
  const save = careSaves[key]
  if (save.pending === 0) save.confirmed = useProfileStore.getState()[key]
  const seq = ++save.seq
  save.pending += 1
  updateProfile({ [key]: value })
  try {
    const saved = await request()
    save.confirmed = saved[key]
    if (seq === save.seq) updateProfile({ [key]: saved[key] })
  } catch (error) {
    if (seq === save.seq) save.latestFailed = true
    throw error
  } finally {
    save.pending -= 1
    if (save.pending === 0) {
      if (save.latestFailed) updateProfile({ [key]: save.confirmed as Profile[K] })
      save.latestFailed = false
    }
  }
}

export const saveDiagnosisDate = (diagnosisDate: string) =>
  saveCareField('diagnosisDate', diagnosisDate, () => updateDiagnosisDate(diagnosisDate))

export const saveCareMode = (careMode: CareMode) =>
  saveCareField('careMode', careMode, () => updateCareMode(careMode))

export const saveContactMemo = (contactMemo: string) =>
  saveCareField('contactMemo', contactMemo, () => updateContactMemo(contactMemo))

// 서버에 입원 상태를 저장한 뒤 기기에 반영. 다시 켜기인데 서버가 이미 입원 중이 아니면(409) 그대로 끔
export async function saveHospitalized(hospitalized: boolean) {
  try {
    await updateHospitalization(hospitalized)
  } catch (error) {
    if (hospitalized || getErrorCode(error) !== 'PREGNANCY_40901') throw error
  }
  // 서버에선 한 상태라 입원하면 다른 상황은 끝남
  useProfileStore.getState().updateProfile({ hospitalized, ...(hospitalized && { paused: false }) })
}

// 다른 상황이에요 · 다시 켜기를 서버에 저장한 뒤 기기에 반영. 다시 켜기인데 서버가 멈춘 상태가 아니면(409) 그대로 끔
export async function savePaused(paused: boolean) {
  try {
    await updateMeasurementPause(paused)
  } catch (error) {
    if (paused || getErrorCode(error) !== 'PREGNANCY_40901') throw error
  }
  // 서버에선 한 상태라 멈추면 입원은 끝남
  useProfileStore.getState().updateProfile({ paused, ...(paused && { hospitalized: false }) })
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

type CheckInput = Pick<PostpartumCheck, 'name' | 'date' | 'remind' | 'place'>

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
