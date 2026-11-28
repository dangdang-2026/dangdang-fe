import { create } from 'zustand'
import { deleteChatMessages, getChatMessages, rateChatMessage } from '@/api/chat'
import type { BotMessage, ChatMessage } from '@/types/chat'

type ChatState = {
  // 서버 대화 + 서버에 안 남는 안내(403 · 429 · 연결 실패). 앱을 닫으면 들어올 때 서버에서 다시 받음
  messages: ChatMessage[]
  addMessage: (message: ChatMessage) => void
  updateMessage: (id: string, changes: Partial<BotMessage>) => void
  removeMessage: (id: string) => void
  // 답을 기다리는 중이면 안내 문구. 화면을 나갔다 와도 이어져 질문이 겹치지 않게
  thinking: string | null
}

// 기록 보기 동의는 useAiStore에 저장
export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, changes) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? ({ ...message, ...changes } as ChatMessage) : message,
      ),
    })),
  removeMessage: (id) =>
    set((state) => ({ messages: state.messages.filter((message) => message.id !== id) })),
  thinking: null,
}))

// 답을 기다리는 중. 화면을 나갔다 와도 이어지게 모듈에(같은 순간 두 번 눌러도 한 번만)
let asking = false
// 기다리는 사이 동의하고 보낸 질문. 지금 답이 끝나면 이어서 물음
let queuedQuestion: string | null = null

// 묻기 시작. 이미 기다리는 중이면 false
export function startAsking(label: string) {
  if (asking) return false
  asking = true
  useChatStore.setState({ thinking: label })
  return true
}

export const isAsking = () => asking

// 답을 받았거나 실패. 기다리던 질문이 있으면 돌려줌
export function finishAsking() {
  asking = false
  useChatStore.setState({ thinking: null })
  const queued = queuedQuestion
  queuedQuestion = null
  return queued
}

export function queueQuestion(question: string) {
  queuedQuestion = question
}

// 서버에 없는 기기 값(진료 탭에 추가함 · 도움 됐나요)은 같은 대화면 유지
function keepLocal(server: ChatMessage, local?: ChatMessage): ChatMessage {
  if (server.from === 'user' || local?.from !== 'bot') return server
  if (server.kind === 'draft' && local.kind === 'draft') return { ...server, added: local.added }
  if (server.kind === 'info' && local.kind === 'info') {
    return { ...server, feedback: server.feedback ?? local.feedback }
  }
  return server
}

// 들어올 때 최근 대화 한 장으로 맞춤. 요청하는 사이 새로 생긴 말풍선은 뒤에 남김
export async function syncChatMessages() {
  const before = new Set(useChatStore.getState().messages.map((message) => message.id))
  const page = await getChatMessages()
  useChatStore.setState((state) => {
    const local = new Map(state.messages.map((message) => [message.id, message]))
    const serverIds = new Set(page.messages.map((message) => message.id))
    const added = state.messages.filter(
      (message) => !before.has(message.id) && !serverIds.has(message.id),
    )
    return {
      messages: [
        ...page.messages.map((message) => keepLocal(message, local.get(message.id))),
        ...added,
      ],
    }
  })
  return page
}

// 이전 대화 한 장을 앞에 붙임
export async function loadOlderChatMessages(cursorId: number) {
  const page = await getChatMessages(cursorId)
  useChatStore.setState((state) => {
    const ids = new Set(state.messages.map((message) => message.id))
    return {
      messages: [...page.messages.filter((message) => !ids.has(message.id)), ...state.messages],
    }
  })
  return page
}

// 서버 대화를 모두 지운 뒤 화면도 비움
export async function clearChatMessages() {
  await deleteChatMessages()
  useChatStore.setState({ messages: [] })
}

// 도움이 됐나요. 먼저 표시하고 서버에 못 남기면 되돌림
export async function rateChatAnswer(id: string, feedback: 'yes' | 'no') {
  const { updateMessage } = useChatStore.getState()
  updateMessage(id, { feedback })
  try {
    await rateChatMessage(id, feedback === 'yes')
  } catch (error) {
    updateMessage(id, { feedback: null })
    throw error
  }
}
