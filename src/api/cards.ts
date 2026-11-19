import { apiClient, type BaseResponse } from '@/api/axios'
import type { NewsCard, NewsSummary } from '@/types/news'

type CardStatus = 'PUBLISHED' | 'CORRECTED' | 'WITHDRAWN'

// 백엔드 CardSummaryResponse. series는 BEFORE_VISIT · GUIDELINE · POSTPARTUM · MIND
export type CardSummaryResponse = {
  id: number
  title: string
  series: string | null
  status: CardStatus
  checkedOn: string | null
  createdAt: string
  saved: boolean
}

// 백엔드 CardDetailResponse. 내려간 카드는 슬라이드 · 출처가 빈 목록
type CardDetailResponse = Omit<CardSummaryResponse, 'createdAt'> & {
  slides: { title: string; text: string }[]
  sources: { title: string; url: string }[]
  reviewer: string | null
  reviewedOn: string | null
  correctionNote: string | null
  correctedAt: string | null
  withdrawnAt: string | null
}

const SERIES_LABEL: Record<string, string> = {
  BEFORE_VISIT: '진료 전에',
  GUIDELINE: '지침은 이렇게 말해요',
  POSTPARTUM: '출산 후에도',
  MIND: '마음 돌보기',
}

// 시리즈 코드 → 화면 이름. 모르는 코드는 당당 소식
const toSeries = (series: string | null) => (series && SERIES_LABEL[series]) || '당당 소식'

// 서버 카드 한 줄 → 화면 카드 목록 한 장. 확인일이 없으면 만든 날
export function toNewsSummary(item: CardSummaryResponse): NewsSummary {
  return {
    id: String(item.id),
    series: toSeries(item.series),
    title: item.title,
    checkedAt: item.checkedOn ?? item.createdAt.slice(0, 10),
    withdrawn: item.status === 'WITHDRAWN',
    saved: item.saved,
  }
}

// 서버 카드 상세 → 화면 카드. 슬라이드 위 작은 글은 시리즈 이름
// 서버에 물어볼 질문이 없어 제목으로 한 문장 만듦
function toNewsCard(item: CardDetailResponse): NewsCard {
  const series = toSeries(item.series)
  const correctedOn = item.correctedAt?.slice(0, 10)
  return {
    id: String(item.id),
    series,
    title: item.title,
    sources: item.sources.map((source) => source.title),
    checkedAt: item.checkedOn ?? '',
    slides: item.slides.map((slide) => ({
      eyebrow: series,
      headline: slide.title,
      body: slide.text,
    })),
    questions: [`「${item.title}」 내용이 제 경우에도 맞는지 궁금해요`],
    correction:
      item.status === 'CORRECTED' && item.correctionNote && correctedOn
        ? { on: correctedOn, summary: '내용을 고쳤어요', detail: item.correctionNote }
        : undefined,
    withdrawn: item.status === 'WITHDRAWN',
    saved: item.saved,
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
