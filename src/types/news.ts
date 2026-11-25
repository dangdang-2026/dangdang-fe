// 당당 소식 카드뉴스 화면 모양
export type NewsSlide = {
  // 슬라이드 위 작은 글. 예: 지침은 이렇게 말해요
  eyebrow: string
  // 출처 기관. 없으면 요약 슬라이드
  source?: string
  headline: string
  body: string
}

export type NewsCard = {
  id: string
  series: string
  title: string
  sources: string[]
  // 출처를 마지막으로 확인한 날. YYYY-MM-DD
  checkedAt: string
  slides: NewsSlide[]
  // 물어볼 것에 적기에서 고를 질문
  questions: string[]
  // 정정한 카드(U-26b). on: YYYY-MM-DD, summary: 요약 한 줄, detail: 자세히(없을 수 있음)
  correction?: { on: string; summary: string; detail?: string }
  // 출처를 다시 확인하느라 내린 카드(U-26c). 목록에선 빼고 링크·저장으로만 열림
  withdrawn?: boolean
  // 내가 저장했는지
  saved?: boolean
  // 내가 공감했는지. 공감 수는 보여 주지 않음
  reacted?: boolean
}

// 목록 한 장. 슬라이드 · 출처는 상세에서만 오고 목록엔 수만 옴(내려간 카드면 0)
export type NewsSummary = Pick<
  NewsCard,
  'id' | 'series' | 'title' | 'checkedAt' | 'withdrawn' | 'saved'
> & { slideCount: number; sourceCount: number }
