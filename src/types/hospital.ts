export type Department = '산부인과' | '내분비내과' | '영양 상담' | '기타'

// 심평원 병원정보에서 찾은 병원. 직접 적으면 주소·종류 없음
export type HospitalInfo = {
  name: string
  // 예: 상급종합병원 · 의원
  kind?: string
  address?: string
  phone?: string
}

// 내가 다니는 병원. 첫 번째가 대표 병원(홈·진료 탭의 다음 진료)
export type Hospital = HospitalInfo & {
  id: string
  department: Department
  // 대표 병원은 useVisitStore의 다음 진료일을 씀
  nextVisitAt: string | null
}
