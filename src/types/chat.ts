import type { MeasureSlotKey } from '@/types/criteria'

// 기록 카드 한 장 요약. 값만 보여 주고 괜찮은지 판단하지 않음
export type RecordsSummary = {
  // 시점을 정하지 않은 질문이면 null(전체)
  slot: MeasureSlotKey | null
  // 예: 저녁 식후 1시간
  label: string
  // 예: 10/8~10/14
  range: string
  // 목표(미만). 정하지 않았거나 전체면 null
  target: number | null
  measured: number
  high: number
  missing: number
  // 한 시점 · 7일 이하일 때만 하루 한 칸, 아니면 빈 배열
  days: { weekday: string; value: number | null; high: boolean }[]
}

// 백엔드 ChatPayload.RecordsCard. 숫자는 서버가 셈
export type ServerRecordsCard = {
  from: string
  to: string
  // FASTING · BREAKFAST_AFTER · LUNCH_AFTER · DINNER_AFTER · BEDTIME, 전체면 null
  slot: string | null
  count: number
  items: { measuredAt: string; slot: string | null; readingType: string; value: number }[]
}

// 일반 정보 출처
export type ChatSource = { title: string; url: string }

// 위험 신호 · 약 용량 안내의 전화 버튼
export type ChatCallAction =
  'CALL_HOSPITAL' | 'CALL_119' | 'CALL_109' | 'CALL_1577_0199' | 'CALL_112' | 'CALL_1366'

// 백엔드 ChatPayload.Risk. 위급 안내 한 틀(급한 증상 · 저혈당 · 마음 · 폭력), warning은 빨간 「…바로 119」 줄
export type ChatRisk = {
  type: 'URGENT' | 'HYPO' | 'MIND' | 'SAFETY'
  title: string
  warning: string
}

// 백엔드 ChatUnknownReason. 답할 수 없는 이유로 버튼을 고름
export type ChatUnknownReason =
  | 'JUDGMENT'
  | 'NO_SOURCE'
  | 'CHITCHAT'
  | 'RUDE'
  | 'OFF_TOPIC'
  | 'NO_CONSENT'
  | 'DISTRESS'
  | 'APP_HELP'
  | 'ABOUT'

// id는 서버 대화 번호(문자열). 서버에 안 남은 말(403 · 429 · 연결 실패)은 기기 임시 id
export type ChatMessage =
  | { id: string; from: 'user'; text: string }
  | { id: string; from: 'bot'; kind: 'records'; text: string; card: ServerRecordsCard }
  // chatMessageId: 서버 「물어볼 말 정리」 답 번호. 앱이 직접 만든 정리 카드는 없음
  | {
      id: string
      from: 'bot'
      kind: 'draft'
      intro: string
      text: string
      added: boolean
      chatMessageId?: string
    }
  | {
      id: string
      from: 'bot'
      kind: 'info'
      text: string
      sources: ChatSource[]
      feedback: 'yes' | 'no' | null
    }
  // dose는 약 용량 안내. 물어볼 말로 적어 둘 수 있게 질문을 같이 둠
  | {
      id: string
      from: 'bot'
      kind: 'risk'
      text: string
      actions: ChatCallAction[]
      dose: boolean
      question: string
      // 예전 대화 줄은 없음
      risk?: ChatRisk | null
    }
  // reason은 예전 대화 줄이면 없음
  | {
      id: string
      from: 'bot'
      kind: 'unknown'
      text: string
      question: string
      reason?: ChatUnknownReason | null
    }
  | { id: string; from: 'bot'; kind: 'fail'; question: string }
  // records는 기록 사용 동의, overseas는 국외 이전 동의(403)가 없을 때
  | {
      id: string
      from: 'bot'
      kind: 'need-consent'
      question: string
      reason: 'records' | 'overseas'
    }
  // 하루 질문 횟수(30번)를 다 씀
  | { id: string; from: 'bot'; kind: 'limit' }

export type BotMessage = Extract<ChatMessage, { from: 'bot' }>
