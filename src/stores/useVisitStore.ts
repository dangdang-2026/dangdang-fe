import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getErrorCode } from '@/api/axios'
import {
  createVisit,
  createVisitNote,
  createVisitQuestion,
  deleteVisitQuestion,
  getAllVisits,
  getVisitNotes,
  getVisitQuestions,
  updateVisitAt,
  updateVisitNote,
  type QuestionSource,
  type VisitQuestionResponse,
  type VisitResponse,
} from '@/api/visits'
import { useHospitalStore } from '@/stores/useHospitalStore'
import type { Question } from '@/types/visit'

type VisitState = {
  // 다음 진료 일정의 서버 id. 질문 · 메모를 여기에 붙임
  visitId: string | null
  // 다음 진료 일시. 모르면 null
  nextVisitAt: string | null
  // 다음 진료 일정의 병원 번호. 없으면 대표 병원으로 보여 줌
  visitCareSiteId: string | null
  // 지나간 진료일. 달력에 진료 태그로(D-13)
  pastVisits: string[]
  // 진료 탭 첫 진입에 다음 진료일을 물어봤는지
  asked: boolean
  questions: Question[]
  // 진료 후 메모. 나갔다 와도 이어 쓰게 남겨 둠
  note: string
  // 메모를 저장한 진료 일정 · 서버 메모 id. 아직 안 남겼으면 null
  noteVisitId: string | null
  noteId: string | null
  // 서버에 아직 안 남긴 글이 있음
  noteDirty: boolean
  // visited면 지금 진료를 다녀온 것으로 보고 지난 진료에 남김
  setNextVisit: (at: string | null, visited?: boolean) => void
  setNote: (note: string) => void
  // 기기 질문 id를 돌려줌
  addQuestion: (text: string, now?: Date) => string
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
      visitCareSiteId: null,
      pastVisits: [],
      asked: false,
      questions: [],
      note: '',
      noteVisitId: null,
      noteId: null,
      noteDirty: false,
      // 다녀온 진료일을 새 날짜로 바꾸면 지난 진료일에 남김
      setNextVisit: (at, markVisited = false) =>
        set((state) => {
          const previous = state.nextVisitAt
          const visited =
            previous && previous !== at && (markVisited || new Date(previous) < new Date())
          return {
            nextVisitAt: at,
            asked: true,
            pastVisits:
              visited && !state.pastVisits.includes(previous)
                ? [...state.pastVisits, previous]
                : state.pastVisits,
          }
        }),
      setNote: (note) => set({ note, noteDirty: true }),
      addQuestion: (text, now = new Date()) => {
        const id = crypto.randomUUID()
        set((state) => ({
          questions: [...state.questions, { id, text, createdAt: now.toISOString() }],
        }))
        return id
      },
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

// 진료일 저장 진행 상태. 저장 중엔 서버 진료 기간이 바뀌기 전이라 기다리고, 끝날 때마다 version을 올려 다시 받음
export const useVisitSaveStore = create<{ saving: number; version: number }>()(() => ({
  saving: 0,
  version: 0,
}))

// 다녀온 진료일을 새 날짜로 바꾸는지. 그러면 지난 일정은 남기고 새 일정을 만듦
const isNewVisit = (previous: string | null, at: string | null, now = new Date()) =>
  !!previous && new Date(previous) < now && previous !== at

// 대표 병원 서버 id. 서버에 없는 병원이면 null
function getPrimaryCareSiteId() {
  const id = Number(useHospitalStore.getState().hospitals[0]?.id)
  return Number.isFinite(id) ? id : null
}

// 지금 일정의 병원 번호(숫자). 없으면 null
function visitCareSiteNo() {
  const id = Number(useVisitStore.getState().visitCareSiteId)
  return useVisitStore.getState().visitCareSiteId && Number.isFinite(id) ? id : null
}

// 다음 진료일 정하기 · 바꾸기 · 모름. 화면엔 바로 바꾸고 서버에 못 남기면 되돌림
// visited: 진료 후 메모에서 정한 날이라 지금 진료는 다녀온 것. 시각이 안 지났어도 새 진료로
export async function saveNextVisit(at: string | null, { visited = false } = {}) {
  const before = useVisitStore.getState()
  before.setNextVisit(at, visited)
  const moving =
    (visited && !!before.nextVisitAt && before.nextVisitAt !== at) ||
    isNewVisit(before.nextVisitAt, at)
  useVisitSaveStore.setState((state) => ({ saving: state.saving + 1 }))
  try {
    // 질문 · 메모가 붙일 일정을 만드는 중일 수 있어 차례를 기다림
    await enqueue(async () => {
      const visitId = useVisitStore.getState().visitId
      const saved =
        visitId && !moving
          ? await updateVisitAt(visitId, at)
          : // 다녀온 일정을 옮기면 그 일정의 병원으로, 처음이면 대표 병원
            await createVisit(visitCareSiteNo() ?? getPrimaryCareSiteId(), at)
      useVisitStore.setState({
        visitId: String(saved.visitId),
        visitCareSiteId: saved.careSiteId === null ? null : String(saved.careSiteId),
      })
      if (!moving || !visitId) return
      // 메모는 다녀온 진료 것이라 새 진료에선 빈 메모로
      useVisitStore.setState({ note: '', noteVisitId: null, noteId: null, noteDirty: false })
      // 남은 질문은 새 진료로 옮김. 실패해도 일정은 저장된 것
      // 같은 차례 안에서 옮겨야 그사이 적은 질문이 두 번 옮겨지지 않음
      await moveQuestions(String(saved.visitId)).catch(() => {})
    })
  } catch (error) {
    useVisitStore.setState({
      nextVisitAt: before.nextVisitAt,
      pastVisits: before.pastVisits,
      asked: before.asked,
    })
    throw error
  } finally {
    useVisitSaveStore.setState((state) => ({
      saving: state.saving - 1,
      version: state.version + 1,
    }))
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
export function syncVisits(keepLocal = true) {
  // 질문 · 메모 저장 중에 만든 일정을 놓치지 않게 차례로
  return enqueue(() => loadVisits(keepLocal))
}

async function loadVisits(keepLocal: boolean) {
  let visits = await getAllVisits()
  if (visits.length === 0 && keepLocal) {
    const { pastVisits, nextVisitAt } = useVisitStore.getState()
    if (pastVisits.length > 0 || nextVisitAt) {
      await moveLocalVisits()
      visits = await getAllVisits()
    }
  }
  // 진료일을 저장하는 중이면 고른 날짜를 옛 서버 값으로 덮지 않음(저장이 끝나면 그 값으로 맞춰짐)
  if (useVisitSaveStore.getState().saving > 0) return
  const current = pickCurrent(visits)
  useVisitStore.setState((state) => ({
    visitId: current ? String(current.visitId) : null,
    nextVisitAt: current?.visitAt ?? null,
    visitCareSiteId: current?.careSiteId != null ? String(current.careSiteId) : null,
    pastVisits: visits
      .filter((visit) => visit !== current && visit.visitAt)
      .map((visit) => visit.visitAt as string),
    // 일정이 하나라도 있으면 이미 물어본 것
    asked: (keepLocal && state.asked) || visits.length > 0,
  }))
}

// 질문 등록 · 삭제 · 옮기기를 차례로. 같은 질문을 만들기 전에 지우거나 일정이 두 번 생기지 않게
let queue: Promise<unknown> = Promise.resolve()

function enqueue<T>(job: () => Promise<T>) {
  const next = queue.then(job)
  queue = next.catch(() => {})
  return next
}

const isServerId = (id: string) => /^\d+$/.test(id)

const toQuestion = (item: VisitQuestionResponse): Question => ({
  id: String(item.questionId),
  text: item.content,
  createdAt: item.createdAt,
  sortOrder: item.sortOrder,
  ...(item.sourceCardId != null && { cardId: String(item.sourceCardId) }),
  ...(item.sourceCardWithdrawn && { cardWithdrawn: true }),
})

// 질문을 붙일 진료 일정. 없으면 날짜 미정 일정을 만듦
async function ensureVisitId() {
  const { visitId } = useVisitStore.getState()
  if (visitId) return visitId
  const saved = await createVisit(getPrimaryCareSiteId(), null)
  useVisitStore.setState({ visitId: String(saved.visitId), asked: true })
  return String(saved.visitId)
}

// 기기 질문을 서버 질문으로 바꿔 끼움
// 출처 질문을 다시 못 남긴 출처 카드 질문은 내려간 표시를 기기에 남김
const SOURCE_ERRORS = ['VISIT_40405', 'VISIT_40406']

function replaceQuestion(localId: string, saved: VisitQuestionResponse, withdrawn = false) {
  useVisitStore.setState((state) => ({
    questions: state.questions.map((item) =>
      item.id === localId
        ? { ...toQuestion(saved), ...(withdrawn && { cardWithdrawn: true }) }
        : item,
    ),
  }))
}

// 기기 질문 하나를 서버에 등록. 당당이 답 · 출처 카드를 서버가 못 알아보면(404) 출처 없이 다시 등록
async function postQuestion(localId: string, sortOrder?: number, source: QuestionSource = {}) {
  const question = useVisitStore.getState().questions.find((item) => item.id === localId)
  // 등록 전에 지운 질문
  if (!question) return
  const visitId = await ensureVisitId()
  const saved = await createVisitQuestion(visitId, question.text, sortOrder, source).catch(
    (error: unknown) => {
      // 당당이 답(VISIT_40405) · 출처 카드(VISIT_40406)를 못 알아볼 때만 출처 없이 다시
      if (!SOURCE_ERRORS.includes(getErrorCode(error) ?? '')) throw error
      return createVisitQuestion(visitId, question.text, sortOrder)
    },
  )
  replaceQuestion(localId, saved, question.cardWithdrawn)
}

// 물어볼 것 추가. 화면엔 바로 넣고 서버에 못 남기면 뺌. 당당이 답에서 왔으면 답 번호도 함께
export async function saveQuestion(text: string, source: QuestionSource = {}) {
  const localId = useVisitStore.getState().addQuestion(text)
  try {
    await enqueue(() => postQuestion(localId, undefined, source))
  } catch (error) {
    useVisitStore.getState().removeQuestion(localId)
    throw error
  }
}

// 물어볼 것 지우기. 화면에서 바로 빼고 서버에 못 지우면 되돌림
export async function deleteQuestion(question: Question, index: number) {
  useVisitStore.getState().removeQuestion(question.id)
  try {
    await enqueue(async () => {
      const { visitId } = useVisitStore.getState()
      if (visitId && isServerId(question.id)) await deleteVisitQuestion(visitId, question.id)
    })
  } catch (error) {
    useVisitStore.getState().restoreQuestion(question, index)
    throw error
  }
}

// 지운 질문 되돌리기. 원래 순서로 다시 등록
export async function restoreDeletedQuestion(question: Question, index: number) {
  const localId = crypto.randomUUID()
  useVisitStore.getState().restoreQuestion({ ...question, id: localId }, index)
  try {
    // 카드뉴스에서 담은 질문이면 출처 카드도 그대로(이미 내려간 카드면 출처 없이)
    await enqueue(() =>
      postQuestion(
        localId,
        question.sortOrder,
        question.cardWithdrawn ? {} : { cardId: question.cardId },
      ),
    )
  } catch (error) {
    useVisitStore.getState().removeQuestion(localId)
    throw error
  }
}

// 다녀온 일정의 질문을 새 일정으로 다시 등록하고 지난 일정에서 지움
async function moveQuestions(toVisitId: string) {
  for (const question of useVisitStore.getState().questions) {
    const source = question.cardWithdrawn ? {} : { cardId: question.cardId }
    const saved = await createVisitQuestion(
      toVisitId,
      question.text,
      question.sortOrder,
      source,
    ).catch((error: unknown) => {
      if (!SOURCE_ERRORS.includes(getErrorCode(error) ?? '')) throw error
      return createVisitQuestion(toVisitId, question.text, question.sortOrder)
    })
    replaceQuestion(question.id, saved, question.cardWithdrawn)
  }
}

// 지금 진료 일정의 질문으로 맞춤. 연동 전에 기기에만 적은 질문은 서버로 옮김
// 새로 로그인하면 기기에 남은 질문은 다른 계정 것일 수 있어 버림
export function syncQuestions(keepLocal = true) {
  return enqueue(async () => {
    const local = keepLocal ? useVisitStore.getState().questions : []
    const { visitId } = useVisitStore.getState()
    let server = visitId ? await getVisitQuestions(visitId) : []
    const unsent = local.filter((item) => !isServerId(item.id))
    if (unsent.length > 0) {
      const target = await ensureVisitId()
      for (const item of unsent) await createVisitQuestion(target, item.text)
      server = await getVisitQuestions(target)
    }
    useVisitStore.setState({ questions: server.map(toQuestion) })
  })
}

// 진료 후 메모를 지금 진료 일정에 남김. 같은 진료면 고치고, 처음이면 등록
export function saveVisitNote() {
  // 부른 때의 글 · 진료를 남김. 기다리는 사이 새 진료로 넘어가도 원래 진료에 남게
  const { note, noteDirty, noteId, noteVisitId, visitId } = useVisitStore.getState()
  const content = note.trim()
  if (!noteDirty || !content) return Promise.resolve()
  return enqueue(async () => {
    const target = noteVisitId ?? visitId ?? (await ensureVisitId())
    // 앞서 기다리던 저장이 메모를 만들었으면 그 번호로 고침. 두 번 만들지 않게
    const latest = useVisitStore.getState()
    const id =
      latest.noteVisitId === target && latest.noteId
        ? latest.noteId
        : noteVisitId === target
          ? noteId
          : null
    const saved = id
      ? await updateVisitNote(target, id, content)
      : await createVisitNote(target, content)
    useVisitStore.setState((state) =>
      // 새 진료로 넘어가 메모가 비워졌으면 그대로 둠
      state.note === '' && state.noteId === null && note !== ''
        ? state
        : {
            noteVisitId: target,
            noteId: String(saved.noteId),
            // 보내는 사이 또 고쳤으면 다음에 다시
            noteDirty: state.note !== note,
          },
    )
  })
}

// 지금 진료 일정의 마지막 메모로 맞춤. 안 남긴 글은 기기 값 유지 후 서버로
// 새로 로그인하면 기기에 남은 메모는 다른 계정 것일 수 있어 버림
export async function syncVisitNote(keepLocal = true) {
  if (!keepLocal) {
    useVisitStore.setState({ note: '', noteVisitId: null, noteId: null, noteDirty: false })
  }
  const { visitId } = useVisitStore.getState()
  const last = visitId ? (await getVisitNotes(visitId)).at(-1) : undefined
  const local = useVisitStore.getState()
  // 연동 전에 적은 메모도 안 남긴 글로 봄
  const dirty = local.noteDirty || (!!local.note.trim() && !local.noteId)
  if (dirty) {
    useVisitStore.setState({
      noteDirty: true,
      ...(last && visitId ? { noteVisitId: visitId, noteId: String(last.noteId) } : {}),
    })
    await saveVisitNote()
    return
  }
  useVisitStore.setState(
    last && visitId
      ? { note: last.content, noteVisitId: visitId, noteId: String(last.noteId), noteDirty: false }
      : { note: '', noteVisitId: null, noteId: null, noteDirty: false },
  )
}
