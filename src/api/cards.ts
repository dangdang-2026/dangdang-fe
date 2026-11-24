import { apiClient, type BaseResponse } from '@/api/axios'
import type { NewsCard, NewsSummary } from '@/types/news'

type CardStatus = 'PUBLISHED' | 'CORRECTED' | 'WITHDRAWN'

// 백엔드 CardSummaryResponse. series는 BEFORE_VISIT · GUIDELINE · POSTPARTUM · MIND, seriesLabel은 그 이름
export type CardSummaryResponse = {
  id: number
  title: string
  series: string | null
  seriesLabel: string | null
  status: CardStatus
  checkedOn: string | null
  createdAt: string
  saved: boolean
}

// 백엔드 CardDetailResponse. 내려간 카드는 슬라이드 · 출처가 빈 목록
type CardDetailResponse = Omit<CardSummaryResponse, 'createdAt'> & {
  // eyebrow · source는 예전 카드면 null
  slides: { title: string; text: string; eyebrow: string | null; source: string | null }[]
  sources: { title: string; url: string }[]
  // 물어볼 것에 적기 질문. 내려간 카드면 빈 목록
  questions: string[]
  reviewer: string | null
  reviewedOn: string | null
  // 정정 요약 한 줄(CORRECTED일 때) · 자세히(없을 수 있음)
  correctionSummary: string | null
  correctionNote: string | null
  correctedAt: string | null
  withdrawnAt: string | null
  reacted: boolean
}

// 서버 이름이 없을 때만 씀. 서버 CardSeries와 같은 이름
const SERIES_LABEL: Record<string, string> = {
  BEFORE_VISIT: '병원 가기 전에',
  GUIDELINE: '지침은 이렇게 말해요',
  POSTPARTUM: '출산 후에도',
  MIND: '마음 돌보기',
}

// 시리즈 화면 이름. 서버 이름 > 코드로 찾은 이름 > 당당 소식
const toSeries = (item: Pick<CardSummaryResponse, 'series' | 'seriesLabel'>) =>
  item.seriesLabel || (item.series && SERIES_LABEL[item.series]) || '당당 소식'

// 서버 카드 한 줄 → 화면 카드 목록 한 장. 확인일이 없으면 만든 날
export function toNewsSummary(item: CardSummaryResponse): NewsSummary {
  return {
    id: String(item.id),
    series: toSeries(item),
    title: item.title,
    checkedAt: item.checkedOn ?? item.createdAt.slice(0, 10),
    withdrawn: item.status === 'WITHDRAWN',
    saved: item.saved,
  }
}

// 서버 카드 상세 → 화면 카드. 슬라이드 위 작은 글이 없으면 시리즈 이름
// 물어볼 질문이 없는 예전 카드는 제목으로 한 문장 만듦
function toNewsCard(item: CardDetailResponse): NewsCard {
  const series = toSeries(item)
  const correctedOn = item.correctedAt?.slice(0, 10)
  return {
    id: String(item.id),
    series,
    title: item.title,
    sources: item.sources.map((source) => source.title),
    checkedAt: item.checkedOn ?? '',
    slides: item.slides.map((slide) => ({
      eyebrow: slide.eyebrow || series,
      source: slide.source || undefined,
      headline: slide.title,
      body: slide.text,
    })),
    questions: item.questions.length
      ? item.questions
      : [`「${item.title}」 내용이 제 경우에도 맞는지 궁금해요`],
    // 요약이 없는 예전 정정은 자세히만 있어 기본 문구로
    correction:
      item.status === 'CORRECTED' && correctedOn && (item.correctionSummary || item.correctionNote)
        ? {
            on: correctedOn,
            summary: item.correctionSummary || '내용을 고쳤어요',
            detail: item.correctionNote || undefined,
          }
        : undefined,
    withdrawn: item.status === 'WITHDRAWN',
    saved: item.saved,
    reacted: item.reacted,
  }
}

// 카드뉴스 목록. 최신순, 내려간 카드는 빠짐
export async function getCards() {
  const { data } = await apiClient.get<BaseResponse<CardSummaryResponse[]>>('/cards')
  return (data.data ?? []).map(toNewsSummary)
}

// 카드뉴스 보기. 내려간 카드도 안내용으로 옴
export async function getCard(cardId: string) {
  const { data } = await apiClient.get<BaseResponse<CardDetailResponse>>(`/cards/${cardId}`)
  if (!data.data) throw new Error('카드뉴스 응답이 비어 있음')
  return toNewsCard(data.data)
}

// 카드 저장. 두 번 눌러도 한 번, 내려간 카드는 409 CARD_40901
export async function saveCard(cardId: string) {
  await apiClient.put(`/cards/${cardId}/save`)
}

// 카드 저장 취소
export async function unsaveCard(cardId: string) {
  await apiClient.delete(`/cards/${cardId}/save`)
}

// 카드 공감. 두 번 눌러도 한 번, 내려간 카드는 409 CARD_40903
export async function reactCard(cardId: string) {
  await apiClient.put(`/cards/${cardId}/reaction`)
}

// 카드 공감 취소. 안 눌렀어도 200
export async function unreactCard(cardId: string) {
  await apiClient.delete(`/cards/${cardId}/reaction`)
}

// 저장한 카드. 최근에 저장한 순, 내려간 카드도 남음
export async function getSavedCards() {
  const { data } = await apiClient.get<BaseResponse<CardSummaryResponse[]>>('/me/card-saves')
  return (data.data ?? []).map(toNewsSummary)
}
