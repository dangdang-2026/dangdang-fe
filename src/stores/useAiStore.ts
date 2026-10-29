import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 동의·거절과 그 날짜. 아직 안 물어봤으면 null
export type AiConsent = { agreed: boolean; at: string } | null

export type AiFeature = 'photo' | 'chat'

type AiState = {
  // 사진으로 음식 후보 찾기
  photo: AiConsent
  // 당당이에게 내 기록 보여 주기
  chat: AiConsent
  setConsent: (feature: AiFeature, agreed: boolean, now?: Date) => void
  // M-12 동의 철회: 둘 다 끔
  withdrawAll: (now?: Date) => void
}

// API 연동 전까지 기기(localStorage)에 저장
export const useAiStore = create<AiState>()(
  persist(
    (set) => ({
      photo: null,
      chat: null,
      setConsent: (feature, agreed, now = new Date()) =>
        set({ [feature]: { agreed, at: now.toISOString() } }),
      withdrawAll: (now = new Date()) =>
        set({
          photo: { agreed: false, at: now.toISOString() },
          chat: { agreed: false, at: now.toISOString() },
        }),
    }),
    { name: 'dangdang-ai' },
  ),
)
