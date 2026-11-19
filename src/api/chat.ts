import { apiClient, type BaseResponse } from '@/api/axios'
import type { ChatCallAction, ChatMessage, ChatSource, ServerRecordsCard } from '@/types/chat'

// 백엔드 ChatKind
type ChatKind =
  | 'QUESTION'
  | 'RECORDS'
  | 'QUESTION_DRAFT'
  | 'INFO'
  | 'UNKNOWN'
  | 'RISK'
  | 'DOSE'
  | 'CONSENT_NEEDED'
  | 'FAILED'

// 백엔드 ChatMessageResponse. kind에 맞는 칸만 채워지고 나머지는 null
export type ChatMessageResponse = {
  id: number
  role: 'USER' | 'ASSISTANT'
  kind: ChatKind
  content: string
  records: ServerRecordsCard | null
  questionDraft: string | null
  sources: ChatSource[] | null
  actions: ChatCallAction[] | null
  helpful: boolean | null
  createdAt: string
}

// 백엔드 ChatAskResponse. 보낸 말과 당당이 답 한 쌍
type ChatAskResponse = { question: ChatMessageResponse; answer: ChatMessageResponse }

const toFeedback = (helpful: boolean | null) =>
  helpful === null ? null : helpful ? ('yes' as const) : ('no' as const)

// 서버 대화 → 화면 말풍선. question은 다시 묻기 · 물어볼 말 정리에 쓰는 바로 앞 질문
export function toChatMessage(item: ChatMessageResponse, question: string): ChatMessage {
  const id = String(item.id)
  switch (item.kind) {
    case 'QUESTION':
      return { id, from: 'user', text: item.content }
    case 'RECORDS':
      return item.records
        ? { id, from: 'bot', kind: 'records', text: item.content, card: item.records }
        : { id, from: 'bot', kind: 'unknown', text: item.content, question }
    case 'QUESTION_DRAFT':
      return {
        id,
        from: 'bot',
        kind: 'draft',
        intro: item.content,
        text: item.questionDraft ?? question,
        added: false,
      }
    case 'INFO':
      return {
        id,
        from: 'bot',
        kind: 'info',
        text: item.content,
        sources: item.sources ?? [],
        feedback: toFeedback(item.helpful),
      }
    case 'RISK':
    case 'DOSE':
      return {
        id,
        from: 'bot',
        kind: 'risk',
        text: item.content,
        actions: item.actions ?? [],
        dose: item.kind === 'DOSE',
        question,
      }
    case 'CONSENT_NEEDED':
      return { id, from: 'bot', kind: 'need-consent', question, reason: 'records' }
    case 'FAILED':
      return { id, from: 'bot', kind: 'fail', question }
    default:
      return { id, from: 'bot', kind: 'unknown', text: item.content, question }
  }
}

// 당당이에게 물어보기(500자). 국외 이전 동의가 없으면 403 AI_40301, 하루 30번 넘으면 429 AI_42901
export async function askChat(content: string) {
  const { data } = await apiClient.post<BaseResponse<ChatAskResponse>>('/chat/messages', {
    content,
  })
  if (!data.data) throw new Error('챗봇 응답이 비어 있음')
  return {
    question: toChatMessage(data.data.question, content),
    answer: toChatMessage(data.data.answer, content),
  }
}
