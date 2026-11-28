// 진료 때 물어볼 것. 리포트 마지막에 함께 들어감
export type Question = {
  id: string
  text: string
  createdAt: string
  // 서버 순서. 되돌릴 때 원래 자리로
  sortOrder?: number
  // 카드뉴스에서 담은 카드 번호 · 그 카드가 내려갔는지
  cardId?: string
  cardWithdrawn?: boolean
}

// AI가 진료 후 메모에서 찾는 항목. 측정 시점·목표·다음 진료일만
export type NoteFindingKey = 'measureSlots' | 'postMealHours' | 'postMeal' | 'fasting' | 'nextVisit'

export type NoteFinding = {
  key: NoteFindingKey
  // 시간·mg/dL 숫자, 다음 진료일은 ISO 시각, 잴 때는 쉼표로 이은 키
  value: number | string
  // 바뀌는 값 표시. 예: 식후 2시간 / 120 미만 / 11월 4일 (화) / 공복·자기 전
  text: string
  // 메모에서 근거가 된 문장. 서버가 못 찾았으면 빈 글
  quote: string
  // 애매하면 이유를 적고 체크 안 한 채로 보여 줌
  needsCheck: string | null
  // 범위 밖 · 지난 날짜처럼 그대로 쓰면 안 되는 값. 체크할 수 없음
  blocked?: boolean
}

export type NoteExtraction = {
  findings: NoteFinding[]
  // 인슐린 · 약 문장은 정리하지 않고 걸러 냈는지만 알려 줌
  insulinSkipped: boolean
}
