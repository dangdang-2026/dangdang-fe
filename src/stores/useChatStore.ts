import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BotMessage, ChatConsent, ChatMessage } from '@/types/chat'

type ChatState = {
  consent: ChatConsent
  // 대화는 앱을 닫으면 사라짐. 화면을 오가는 동안만 유지
  messages: ChatMessage[]
  setConsent: (consent: ChatConsent) => void
  addMessage: (message: ChatMessage) => void
  updateMessage: (id: string, changes: Partial<BotMessage>) => void
  removeMessage: (id: string) => void
}

// 동의 여부만 기기(localStorage)에 저장
export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      consent: null,
      messages: [],
      setConsent: (consent) => set({ consent }),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      updateMessage: (id, changes) =>
        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === id ? ({ ...message, ...changes } as ChatMessage) : message,
          ),
        })),
      removeMessage: (id) =>
        set((state) => ({ messages: state.messages.filter((message) => message.id !== id) })),
    }),
    { name: 'dangdang-chat', partialize: (state) => ({ consent: state.consent }) },
  ),
)
