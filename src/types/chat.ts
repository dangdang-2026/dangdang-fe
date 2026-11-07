import type { MeasureSlotKey } from '@/types/criteria'

// 지난 7일 한 시점 기록 요약. 값만 보여 주고 괜찮은지 판단하지 않음
export type RecordsSummary = {
  slot: MeasureSlotKey
  // 예: 저녁 식후 1시간
  label: string
  // 예: 10/8~10/14
  range: string
  // 목표(미만). 정하지 않았으면 null
  target: number | null
  measured: number
  high: number
  missing: number
  days: { weekday: string; value: number | null; high: boolean }[]
}

// 승인된 출처에서 가져온 일반 정보
export type ChatInfo = {
  id: string
  keywords: string[][]
  answer: string
  source: { label: string; url: string }
  followUp?: string
}

export type ChatMessage =
  | { id: string; from: 'user'; text: string }
  | { id: string; from: 'bot'; kind: 'records'; summary: RecordsSummary }
  | { id: string; from: 'bot'; kind: 'draft'; intro: string; text: string; added: boolean }
  | { id: string; from: 'bot'; kind: 'info'; infoId: string; feedback: 'yes' | 'no' | null }
  | { id: string; from: 'bot'; kind: 'risk' }
  | { id: string; from: 'bot'; kind: 'unknown'; question: string }
  | { id: string; from: 'bot'; kind: 'fail'; question: string }
  | { id: string; from: 'bot'; kind: 'need-consent'; question: string }

export type BotMessage = Extract<ChatMessage, { from: 'bot' }>
