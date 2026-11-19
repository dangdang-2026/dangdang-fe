import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  getConsents,
  saveChatConsent as postChatConsent,
  savePhotoConsent as postPhotoConsent,
  withdrawAiConsents as postWithdrawAiConsents,
} from '@/api/consent'

// 동의·거절과 그 날짜. 아직 안 물어봤으면 null
export type AiConsent = { agreed: boolean; at: string } | null

export type AiFeature = 'photo' | 'chat'

type AiState = {
  // 사진으로 음식 후보 찾기
  photo: AiConsent
  // 당당이에게 내 기록 보여 주기
  chat: AiConsent
  setConsent: (feature: AiFeature, agreed: boolean, now?: Date) => void
  // F-10 찍은 사진을 날짜·시각을 찍어 내 사진첩에도 저장
  saveToAlbum: boolean
  setSaveToAlbum: (saveToAlbum: boolean) => void
  // M-12 동의 철회: 둘 다 끔
  withdrawAll: (now?: Date) => void
}

// 서버 동의를 기기에도 둠. 사진 · 기록 보기 동의 모두 서버가 기준
export const useAiStore = create<AiState>()(
  persist(
    (set) => ({
      photo: null,
      chat: null,
      saveToAlbum: true,
      setSaveToAlbum: (saveToAlbum) => set({ saveToAlbum }),
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

// 서버에 기록 보기 동의를 저장한 뒤 기기에 반영
export async function saveChatConsent(agreed: boolean) {
  await postChatConsent(agreed)
  useAiStore.getState().setConsent('chat', agreed)
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

// 서버 동의로 사진 · 기록 보기 동의를 맞춤. 한 번도 안 골랐으면 다시 물어봄
// 기록 보기는 기록 사용 · 국외 이전 둘 다 있어야 켜짐
export async function syncAiConsents() {
  const items = await getConsents()
  const photo = items.find((item) => item.type === 'AI_PHOTO')
  const records = items.find((item) => item.type === 'AI_CHAT_RECORDS')
  const overseas = items.find((item) => item.type === 'OVERSEAS_TRANSFER')
  useAiStore.setState({
    photo: photo?.occurredAt ? { agreed: photo.granted, at: photo.occurredAt } : null,
    chat: records?.occurredAt
      ? { agreed: records.granted && !!overseas?.granted, at: records.occurredAt }
      : null,
  })
}
