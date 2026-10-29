// 진료 때 물어볼 것. 리포트 마지막에 함께 들어감
export type Question = {
  id: string
  text: string
  createdAt: string
}

// AI가 진료 후 메모에서 찾는 항목. 측정 시점·목표·다음 진료일만
export type NoteFindingKey = 'postMealHours' | 'postMeal' | 'fasting' | 'nextVisit'

export type NoteFinding = {
  key: NoteFindingKey
  // 시간·mg/dL 숫자, 다음 진료일은 ISO 시각
  value: number | string
  // 바뀌는 값 표시. 예: 식후 2시간 / 120 미만 / 11월 4일 (화) 오전
  text: string
  // 메모에서 근거가 된 문장
  quote: string
  // 애매하면 이유를 적고 체크 안 한 채로 보여 줌
  needsCheck: string | null
}

export type NoteExtraction = {
  findings: NoteFinding[]
  // 인슐린 이야기는 정리하지 않고 문장만 알려 줌
  insulinQuote: string | null
}
