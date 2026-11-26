import { apiClient, type BaseResponse } from '@/api/axios'
import type { AgreementKey } from '@/stores/useOnboardingStore'

// 백엔드 ConsentType
type ConsentType =
  | 'AGE_14'
  | 'TERMS'
  | 'PRIVACY'
  | 'SENSITIVE'
  | 'MARKETING'
  | 'AI_PHOTO'
  | 'AI_CHAT_RECORDS'
  | 'OVERSEAS_TRANSFER'

const CONSENT_TYPE: Record<AgreementKey, ConsentType> = {
  age: 'AGE_14',
  terms: 'TERMS',
  privacy: 'PRIVACY',
  sensitive: 'SENSITIVE',
  marketing: 'MARKETING',
}

// 약관 화면(A-01) 5개 항목을 한 번에 저장. 안 고른 선택 항목은 거부로
export async function saveConsents(agreed: AgreementKey[]) {
  const items = (Object.keys(CONSENT_TYPE) as AgreementKey[]).map((key) => ({
    type: CONSENT_TYPE[key],
    granted: agreed.includes(key),
  }))
  await apiClient.post('/me/consents', { items })
}

// 백엔드 ConsentResponse. 한 번도 안 고른 항목은 granted=false · occurredAt=null
type ConsentResponse = {
  completed: boolean
  items: { type: ConsentType; required: boolean; granted: boolean; occurredAt: string | null }[]
}

// 동의 항목별 최신 상태
export async function getConsents() {
  const { data } = await apiClient.get<BaseResponse<ConsentResponse>>('/me/consents')
  if (!data.data) throw new Error('동의 상태 응답이 비어 있음')
  return data.data.items
}

// 당당이 동의. 기록 보고 답하기(AI_CHAT_RECORDS, 선택)와 해외로 보내기(OVERSEAS_TRANSFER, 당당이 · 메모 정리에 필수)를 따로. 넘긴 것만 저장
export async function saveChatConsents(consents: { records?: boolean; overseas?: boolean }) {
  const items: { type: ConsentType; granted: boolean }[] = [
    ...(consents.records === undefined
      ? []
      : [{ type: 'AI_CHAT_RECORDS' as const, granted: consents.records }]),
    ...(consents.overseas === undefined
      ? []
      : [{ type: 'OVERSEAS_TRANSFER' as const, granted: consents.overseas }]),
  ]
  await apiClient.post('/me/consents', { items })
}

// 사진 AI 분석 동의. 사진은 당당 서버에서만 처리해서 국외 이전은 안 씀
export async function savePhotoConsent(agreed: boolean) {
  await apiClient.post('/me/consents', { items: [{ type: 'AI_PHOTO', granted: agreed }] })
}

// 광고성 정보 받기 동의 · 거부(N-09 · 마이 › 알림)
export async function saveMarketingConsent(agreed: boolean) {
  await apiClient.post('/me/consents', { items: [{ type: 'MARKETING', granted: agreed }] })
}

// M-12 AI 사용 동의 모두 철회
export async function withdrawAiConsents() {
  const types: ConsentType[] = ['AI_PHOTO', 'AI_CHAT_RECORDS', 'OVERSEAS_TRANSFER']
  await apiClient.post('/me/consents', {
    items: types.map((type) => ({ type, granted: false })),
  })
}
