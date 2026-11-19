import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getMealPlan, saveMealPlan, type MealPlanResponse } from '@/api/mealPlan'
import { useHospitalStore } from '@/stores/useHospitalStore'

// 영양 상담에서 받은 식사 안내. 받은 표현 그대로, 앱은 실제 식사와 비교하지 않음
export type MealGuide = {
  // YYYY-MM-DD
  receivedOn: string
  place: string
  meals: string
  snacks: string
  // 받은 식단표 사진 1장(줄인 data URL). 기기에만 저장
  photo?: string
  createdAt: string
  // 고친 날짜. 처음 저장이면 없음
  updatedAt?: string
}

type MealGuideInput = Omit<MealGuide, 'createdAt' | 'updatedAt'>

type MealGuideState = {
  guide: MealGuide | null
  saveGuide: (input: MealGuideInput, now?: Date) => void
}

// 서버 안내를 기기에도 둠. 사진만 기기에
export const useMealGuideStore = create<MealGuideState>()(
  persist(
    (set) => ({
      guide: null,
      saveGuide: (input, now = new Date()) =>
        set((state) => ({
          guide: state.guide
            ? { ...input, createdAt: state.guide.createdAt, updatedAt: now.toISOString() }
            : { ...input, createdAt: now.toISOString() },
        })),
    }),
    { name: 'dangdang-meal-guide' },
  ),
)

// 받은 곳은 내 병원 이름이면 그 병원 번호로, 직접 적은 곳은 서버에 안 남음
function toInput(guide: MealGuideInput) {
  const hospital = useHospitalStore.getState().hospitals.find((item) => item.name === guide.place)
  return {
    careSiteId: hospital ? Number(hospital.id) : null,
    receivedOn: guide.receivedOn,
    mealGuide: guide.meals,
    snackGuide: guide.snacks,
  }
}

// 서버에 저장한 뒤 기기에 반영
export async function saveMealGuide(input: MealGuideInput) {
  await saveMealPlan(toInput(input))
  useMealGuideStore.getState().saveGuide(input)
}

// 서버 안내 → 기기 안내. 사진 · 처음 입력 날짜 · 직접 적은 받은 곳은 기기 값
function fromServer(plan: MealPlanResponse, local: MealGuide | null): MealGuide {
  const hospital = useHospitalStore
    .getState()
    .hospitals.find((item) => item.id === String(plan.careSiteId))
  const createdAt = local?.createdAt ?? plan.updatedAt
  return {
    receivedOn: plan.receivedOn ?? local?.receivedOn ?? plan.updatedAt.slice(0, 10),
    place: hospital?.name ?? local?.place ?? '',
    meals: plan.mealGuide ?? '',
    snacks: plan.snackGuide ?? '',
    photo: local?.photo,
    createdAt,
    updatedAt: local?.updatedAt ?? (plan.updatedAt !== createdAt ? plan.updatedAt : undefined),
  }
}

// 서버 안내로 맞춤. 연동 전에 기기에만 적은 안내는 서버로 옮김
// 새로 로그인하면 기기에 남은 건 다른 계정 것일 수 있어 버림
export async function syncMealGuide(keepLocal = true) {
  const local = keepLocal ? useMealGuideStore.getState().guide : null
  const plan = await getMealPlan()
  if (plan) {
    useMealGuideStore.setState({ guide: fromServer(plan, local) })
    return
  }
  if (local && (local.meals || local.snacks)) {
    await saveMealPlan(toInput(local))
    return
  }
  useMealGuideStore.setState({ guide: null })
}
