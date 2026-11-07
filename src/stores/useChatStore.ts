import { create } from 'zustand'
import type { BotMessage, ChatMessage } from '@/types/chat'

type ChatState = {
  // 대화는 앱을 닫으면 사라짐. 화면을 오가는 동안만 유지
  messages: ChatMessage[]
  addMessage: (message: ChatMessage) => void
  updateMessage: (id: string, changes: Partial<BotMessage>) => void
  removeMessage: (id: string) => void
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
}))
