import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  getConsents,
  saveChatConsents as postChatConsents,
  savePhotoConsent as postPhotoConsent,
  withdrawAiConsents as postWithdrawAiConsents,
} from '@/api/consent'

// 동의·거절과 그 날짜. 아직 안 물어봤으면 null
// reconsent: 문서가 바뀌어 다시 동의해야 함(거절이 아님)
export type AiConsent = { agreed: boolean; at: string; reconsent?: boolean } | null

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
      // v0은 해외로 보내기를 참 · 거짓으로만 둠. 동의였으면 기록 보기 날짜(없으면 지금)로 옮겨 다시 묻지 않게, 서버 동의를 받으면 맞춰짐
      migrate: (persisted) => {
        const state = persisted as Omit<Partial<AiState>, 'overseas'> & { overseas?: unknown }
        if (state.overseas === true) {
          return {
            ...state,
            overseas: { agreed: true, at: state.chat?.at ?? new Date().toISOString() },
          }
        }
        return { ...state, overseas: typeof state.overseas === 'object' ? state.overseas : null }
      },
    },
  ),
)

// 동의를 저장할 때마다 올림. 저장보다 먼저 시작한 서버 동의 받기가 늦게 와도 새 값을 덮지 않게
let consentVersion = 0

// 서버에 당당이 동의(기록 보기 · 해외로 보내기)를 저장한 뒤 기기에 반영. 넘긴 것만
export async function saveChatConsents(consents: { records?: boolean; overseas?: boolean }) {
  consentVersion += 1
  await postChatConsents(consents)
  const { setConsent } = useAiStore.getState()
  if (consents.records !== undefined) setConsent('chat', consents.records)
  if (consents.overseas !== undefined) setConsent('overseas', consents.overseas)
}

// 가입 동의(A-01)에서 서버에 저장한 해외 전송 동의를 기기에 반영. 늦게 온 서버 동의 받기가 덮지 않게
export function markOverseasConsent(agreed: boolean) {
  consentVersion += 1
  useAiStore.getState().setConsent('overseas', agreed)
}

// 서버에 사진 AI 분석 동의를 저장한 뒤 기기에 반영
export async function savePhotoConsent(agreed: boolean) {
  consentVersion += 1
  await postPhotoConsent(agreed)
  useAiStore.getState().setConsent('photo', agreed)
}

// 서버에서 AI 동의를 모두 철회한 뒤 기기도 끔
export async function withdrawAiConsents() {
  consentVersion += 1
  await postWithdrawAiConsents()
  useAiStore.getState().withdrawAll()
}

// 서버 동의로 맞춤. 한 번도 안 골랐으면 다시 물어봄
export async function syncAiConsents() {
  const version = consentVersion
  const items = await getConsents()
  // 받는 사이 저장한 동의가 있으면 그 값이 최신이라 버림
  if (version !== consentVersion) return
  const toConsent = (type: string): AiConsent => {
    const item = items.find((consent) => consent.type === type)
    if (!item?.occurredAt) return null
    return {
      agreed: item.granted,
      at: item.occurredAt,
      reconsent: item.needsReconsent || undefined,
    }
  }
  useAiStore.setState({
    photo: toConsent('AI_PHOTO'),
    chat: toConsent('AI_CHAT_RECORDS'),
    overseas: toConsent('OVERSEAS_TRANSFER'),
  })
}
