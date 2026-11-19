import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createVisit, getAllVisits, updateVisitAt, type VisitResponse } from '@/api/visits'
import { useHospitalStore } from '@/stores/useHospitalStore'
import type { Question } from '@/types/visit'

type VisitState = {
  // 다음 진료 일정의 서버 id. 질문 · 메모를 여기에 붙임
  visitId: string | null
  // 다음 진료 일시. 모르면 null
  nextVisitAt: string | null
  // 지나간 진료일. 달력에 진료 태그로(D-13)
  pastVisits: string[]
  // 진료 탭 첫 진입에 다음 진료일을 물어봤는지
  asked: boolean
  questions: Question[]
  // 진료 후 메모. 나갔다 와도 이어 쓰게 남겨 둠
  note: string
  setNextVisit: (at: string | null) => void
  setNote: (note: string) => void
  addQuestion: (text: string, now?: Date) => void
  removeQuestion: (id: string) => void
  // 지운 질문을 원래 자리에 되돌림
  restoreQuestion: (question: Question, index: number) => void
}

// 서버 진료 일정을 기기에도 둠
export const useVisitStore = create<VisitState>()(
  persist(
    (set) => ({
      visitId: null,
      nextVisitAt: null,
      pastVisits: [],
      asked: false,
      questions: [],
      note: '',
      // 다녀온 진료일을 새 날짜로 바꾸면 지난 진료일에 남김
      setNextVisit: (at) =>
        set((state) => {
          const previous = state.nextVisitAt
          const visited = previous && new Date(previous) < new Date() && previous !== at
          return {
            nextVisitAt: at,
            asked: true,
            pastVisits:
              visited && !state.pastVisits.includes(previous)
                ? [...state.pastVisits, previous]
                : state.pastVisits,
          }
        }),
      setNote: (note) => set({ note }),
      addQuestion: (text, now = new Date()) =>
        set((state) => ({
          questions: [
            ...state.questions,
            { id: crypto.randomUUID(), text, createdAt: now.toISOString() },
          ],
        })),
      removeQuestion: (id) =>
        set((state) => ({ questions: state.questions.filter((item) => item.id !== id) })),
      restoreQuestion: (question, index) =>
        set((state) => {
          const questions = [...state.questions]
          questions.splice(index, 0, question)
          return { questions }
        }),
    }),
    { name: 'dangdang-visit' },
  ),
)

// 다녀온 진료일을 새 날짜로 바꾸는지. 그러면 지난 일정은 남기고 새 일정을 만듦
const isNewVisit = (previous: string | null, at: string | null, now = new Date()) =>
  !!previous && new Date(previous) < now && previous !== at

// 대표 병원 서버 id. 서버에 없는 병원이면 null
function getPrimaryCareSiteId() {
  const id = Number(useHospitalStore.getState().hospitals[0]?.id)
  return Number.isFinite(id) ? id : null
}

// 다음 진료일 정하기 · 바꾸기 · 모름. 화면엔 바로 바꾸고 서버에 못 남기면 되돌림
export async function saveNextVisit(at: string | null) {
  const before = useVisitStore.getState()
  const { visitId, nextVisitAt } = before
  before.setNextVisit(at)
  try {
    const saved =
      visitId && !isNewVisit(nextVisitAt, at)
        ? await updateVisitAt(visitId, at)
        : await createVisit(getPrimaryCareSiteId(), at)
    useVisitStore.setState({ visitId: String(saved.visitId) })
  } catch (error) {
    useVisitStore.setState({
      visitId: before.visitId,
      nextVisitAt: before.nextVisitAt,
      pastVisits: before.pastVisits,
      asked: before.asked,
    })
    throw error
  }
}

// 지금 진료 일정: 날짜 미정이 있으면 가장 최근에 만든 것, 없으면 가장 늦은 날짜
function pickCurrent(visits: VisitResponse[]) {
  const undated = visits
    .filter((visit) => !visit.visitAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (undated[0]) return undated[0]
  return [...visits].sort((a, b) => (b.visitAt ?? '').localeCompare(a.visitAt ?? ''))[0] ?? null
}

// 연동 전에 기기에만 적은 진료일을 서버로 옮김. 지난 진료일 먼저, 다음 진료일은 마지막
async function moveLocalVisits() {
  const { pastVisits, nextVisitAt, asked } = useVisitStore.getState()
  const careSiteId = getPrimaryCareSiteId()
  for (const at of pastVisits) await createVisit(careSiteId, at)
  if (nextVisitAt || asked) await createVisit(careSiteId, nextVisitAt)
}

// 서버 일정으로 다음 진료일 · 지난 진료일을 맞춤
// 새로 로그인하면 기기에 남은 건 다른 계정 것일 수 있어 버림
export async function syncVisits(keepLocal = true) {
  let visits = await getAllVisits()
  if (visits.length === 0 && keepLocal) {
    const { pastVisits, nextVisitAt } = useVisitStore.getState()
    if (pastVisits.length > 0 || nextVisitAt) {
      await moveLocalVisits()
      visits = await getAllVisits()
    }
  }
  const current = pickCurrent(visits)
  useVisitStore.setState((state) => ({
    visitId: current ? String(current.visitId) : null,
    nextVisitAt: current?.visitAt ?? null,
    pastVisits: visits
      .filter((visit) => visit !== current && visit.visitAt)
      .map((visit) => visit.visitAt as string),
    // 일정이 하나라도 있으면 이미 물어본 것
    asked: (keepLocal && state.asked) || visits.length > 0,
  }))
}
