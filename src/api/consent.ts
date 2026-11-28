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
  | 'COMMUNITY_AI_CHECK'

const CONSENT_TYPE: Record<AgreementKey, ConsentType> = {
  age: 'AGE_14',
  terms: 'TERMS',
  privacy: 'PRIVACY',
  sensitive: 'SENSITIVE',
  ai: 'OVERSEAS_TRANSFER',
  marketing: 'MARKETING',
}

// 고를 때만 저장하는 항목. AI · 해외 전송은 안 골라도 전에 당당이에서 한 동의를 끄지 않음
const ONLY_WHEN_AGREED: AgreementKey[] = ['ai']

// 약관 화면(A-01) 항목을 한 번에 저장. 안 고른 선택 항목은 거부로
// AI · 해외 전송은 고를 때만, 이 가입에서 골랐다(previous) 다시 빼면 거부로
export async function saveConsents(agreed: AgreementKey[], previous: AgreementKey[] = []) {
  const items = (Object.keys(CONSENT_TYPE) as AgreementKey[])
    .filter(
      (key) => agreed.includes(key) || previous.includes(key) || !ONLY_WHEN_AGREED.includes(key),
    )
    .map((key) => ({ type: CONSENT_TYPE[key], granted: agreed.includes(key) }))
  await apiClient.post('/me/consents', { items })
}

// 백엔드 ConsentResponse. 한 번도 안 고른 항목은 granted=false · occurredAt=null
type ConsentResponse = {
  completed: boolean
  // needsReconsent: 예전 문서 버전에 동의해서 다시 물어야 함(거절과 다름)
  items: {
    type: ConsentType
    required: boolean
    granted: boolean
    occurredAt: string | null
    needsReconsent?: boolean
  }[]
}

// 동의 항목별 최신 상태
export async function getConsents() {
  const { data } = await apiClient.get<BaseResponse<ConsentResponse>>('/me/consents')
  if (!data.data) throw new Error('동의 상태 응답이 비어 있음')
  return data.data.items
}

// 커뮤니티 글 AI 확인(해외 전송) 고지를 확인함. 안 하면 서버가 AI 없이 규칙으로만 확인
export async function saveCommunityAiCheck() {
  await apiClient.post('/me/consents', { items: [{ type: 'COMMUNITY_AI_CHECK', granted: true }] })
}

// 커뮤니티 AI 확인을 했는지(예전 문서 버전이면 서버가 false로 줌)
export async function hasCommunityAiCheck() {
  return (await getConsents()).some((item) => item.type === 'COMMUNITY_AI_CHECK' && item.granted)
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

// 건강정보 동의 철회(M-07b). 서버가 혈당 · 식사 · 진료 등 건강 기록을 바로 지우고 consentCompleted=false
export async function withdrawSensitiveConsent() {
  await apiClient.post('/me/consents/sensitive/withdraw')
}

// 건강정보 동의한 날. 안 골랐거나 철회했으면 null
export async function getSensitiveConsentAt() {
  const item = (await getConsents()).find((consent) => consent.type === 'SENSITIVE')
  return item?.granted ? item.occurredAt : null
}

// M-12 AI 사용 동의 모두 철회
export async function withdrawAiConsents() {
  const types: ConsentType[] = ['AI_PHOTO', 'AI_CHAT_RECORDS', 'OVERSEAS_TRANSFER']
  await apiClient.post('/me/consents', {
    items: types.map((type) => ({ type, granted: false })),
  })
}
