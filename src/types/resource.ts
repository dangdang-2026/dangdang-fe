// 공식 자료 링크. 원문 확인 전이면 url 없음
export type ResourceLink = {
  id: string
  // 예: 질병관리청 국가건강정보포털
  source: string
  title: string
  url: string | null
}

// 출처를 붙인 한 장 요약. 공식 자료 문장을 그대로 옮김
export type ResourceSummary = {
  id: string
  // 예: 식사
  category: string
  title: string
  description: string
  // 지침 문장. 해석·권고 없음
  items: string[]
  sources: { label: string; url: string | null }[]
  note: string
  // 원문을 확인한 날
  checkedOn: string
}
