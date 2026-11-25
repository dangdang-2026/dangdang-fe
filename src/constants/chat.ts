// Figma Q-02 추천 질문
export const CHAT_SUGGESTIONS = [
  { icon: 'records', text: '지난 7일 저녁 식후 기록 보여 줘' },
  { icon: 'memo', text: '진료 때 물어볼 말 정리해 줘' },
  { icon: 'info', text: '식후 1시간은 언제부터 재요?' },
  { icon: 'alert', text: '이럴 땐 바로 병원에 연락하세요' },
] as const

// Figma Q-02b 기록 보기 동의를 안 했으면 기록 질문 대신 일반 질문
export const CHAT_SUGGESTIONS_GENERAL = [
  { icon: 'records', text: '공복 혈당은 언제 재요?' },
  ...CHAT_SUGGESTIONS.slice(1),
] as const
