import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  getConsents,
  saveChatConsents as postChatConsents,
  savePhotoConsent as postPhotoConsent,
  withdrawAiConsents as postWithdrawAiConsents,
} from '@/api/consent'

// 동의·거절과 그 날짜. 아직 안 물어봤으면 null
export type AiConsent = { agreed: boolean; at: string } | null

export type AiFeature = 'photo' | 'chat' | 'overseas'

type AiState = {
  // 사진으로 음식 후보 찾기
  photo: AiConsent
  // 당당이에게 내 기록 보여 주기(선택)
  chat: AiConsent
  // 해외로 보내기(미국 OpenAI). 없으면 당당이 · 진료 메모 정리를 서버가 403
  overseas: AiConsent
  setConsent: (feature: AiFeature, agreed: boolean, now?: Date) => void
  // F-10 찍은 사진을 날짜·시각을 찍어 내 사진첩에도 저장
  saveToAlbum: boolean
  setSaveToAlbum: (saveToAlbum: boolean) => void
  // M-12 동의 철회: 모두 끔
  withdrawAll: (now?: Date) => void
}

// 서버 동의를 기기에도 둠. 사진 · 기록 보기 · 해외로 보내기 모두 서버가 기준
export const useAiStore = create<AiState>()(
  persist(
    (set) => ({
      photo: null,
      chat: null,
      overseas: null,
      saveToAlbum: true,
      setSaveToAlbum: (saveToAlbum) => set({ saveToAlbum }),
      setConsent: (feature, agreed, now = new Date()) =>
        set({ [feature]: { agreed, at: now.toISOString() } }),
      withdrawAll: (now = new Date()) => {
        const off = { agreed: false, at: now.toISOString() }
        set({ photo: off, chat: off, overseas: off })
      },
    }),
    {
      name: 'dangdang-ai',
      version: 1,
      // v0은 해외로 보내기를 참 · 거짓으로만 둠. 날짜를 몰라 다음 서버 동의 받기 전까지 안 물어본 것으로
      migrate: (persisted) => {
        const state = persisted as Partial<AiState> & { overseas?: unknown }
        return { ...state, overseas: typeof state.overseas === 'object' ? state.overseas : null }
      },
    },
  ),
)

// 서버에 당당이 동의(기록 보기 · 해외로 보내기)를 저장한 뒤 기기에 반영. 넘긴 것만
export async function saveChatConsents(consents: { records?: boolean; overseas?: boolean }) {
  await postChatConsents(consents)
  const { setConsent } = useAiStore.getState()
  if (consents.records !== undefined) setConsent('chat', consents.records)
  if (consents.overseas !== undefined) setConsent('overseas', consents.overseas)
}

// 서버에 사진 AI 분석 동의를 저장한 뒤 기기에 반영
export async function savePhotoConsent(agreed: boolean) {
  await postPhotoConsent(agreed)
  useAiStore.getState().setConsent('photo', agreed)
}

// 서버에서 AI 동의를 모두 철회한 뒤 기기도 끔
export async function withdrawAiConsents() {
  await postWithdrawAiConsents()
  useAiStore.getState().withdrawAll()
}

// 서버 동의로 맞춤. 한 번도 안 골랐으면 다시 물어봄
export async function syncAiConsents() {
  const items = await getConsents()
  const toConsent = (type: string): AiConsent => {
    const item = items.find((consent) => consent.type === type)
    return item?.occurredAt ? { agreed: item.granted, at: item.occurredAt } : null
  }
  useAiStore.setState({
    photo: toConsent('AI_PHOTO'),
    chat: toConsent('AI_CHAT_RECORDS'),
    overseas: toConsent('OVERSEAS_TRANSFER'),
  })
}
