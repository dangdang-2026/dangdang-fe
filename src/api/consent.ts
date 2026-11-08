import { apiClient } from '@/api/axios'
import type { AgreementKey } from '@/stores/useOnboardingStore'

// 백엔드 ConsentType
type ConsentType = 'AGE_14' | 'TERMS' | 'PRIVACY' | 'SENSITIVE' | 'MARKETING'

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
