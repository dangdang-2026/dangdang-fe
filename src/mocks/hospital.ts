import type { Hospital, HospitalInfo } from '@/types/hospital'

// 처음 쓰는 기기에 미리 넣어 두는 병원. 심평원 연동 전 임시
export const DEFAULT_HOSPITAL: Hospital = {
  id: 'default-hospital',
  name: '○○산부인과',
  kind: '의원',
  address: '서울 ○○구 ○○로 00',
  department: '산부인과',
  nextVisitAt: null,
}

// 심평원 병원 검색 연동 전 목업 목록
export const MOCK_HOSPITAL_DIRECTORY: HospitalInfo[] = [
  {
    name: '○○대학교병원',
    kind: '상급종합병원',
    address: '서울 ○○구 ○○로 00',
    phone: '02-000-0000',
  },
  { name: '○○대학교 △△병원', kind: '종합병원', address: '경기 △△시 △△로 00', phone: '02-000-0000' },
  {
    name: '○○대학교 부속 □□의원',
    kind: '의원',
    address: '서울 □□구 □□길 00',
    phone: '02-000-0000',
  },
  { name: '○○산부인과', kind: '의원', address: '서울 ○○구 ○○로 00', phone: '02-000-0000' },
  { name: '△△여성병원', kind: '병원', address: '서울 △△구 △△로 00', phone: '02-000-0000' },
  { name: '□□내과의원', kind: '의원', address: '경기 □□시 □□로 00', phone: '02-000-0000' },
]
