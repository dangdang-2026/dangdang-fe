import type { Department } from '@/types/hospital'

export const DEPARTMENTS: Department[] = ['산부인과', '내분비내과', '영양 상담', '기타']

// Figma C-14 진료과 칩 색
export const DEPARTMENT_CHIP: Record<Department, string> = {
  산부인과: 'bg-yellow-100',
  내분비내과: 'bg-blue-50',
  '영양 상담': 'bg-green-50',
  기타: 'bg-grey-100',
}

// 카드 둘째 줄 설명
export const DEPARTMENT_NOTE: Record<Department, string | null> = {
  산부인과: '진단 · 산전 진료',
  내분비내과: '혈당 관리 · 인슐린',
  '영양 상담': '식단 상담',
  기타: null,
}
