import type { Hospital } from '@/types/hospital'

// 처음 쓰는 기기에 미리 넣어 두는 병원. 심평원 연동 전 임시
export const DEFAULT_HOSPITAL: Hospital = {
  id: 'default-hospital',
  name: '○○산부인과',
  kind: '의원',
  address: '서울 ○○구 ○○로 00',
  department: '산부인과',
  nextVisitAt: null,
}
