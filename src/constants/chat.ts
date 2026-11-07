import type { ChatInfo } from '@/types/chat'

// 생각 중 말풍선을 보여 주는 시간
export const CHAT_THINKING_MS = 900

// Figma Q-02 추천 질문
export const CHAT_SUGGESTIONS = [
  { icon: 'records', text: '지난 7일 저녁 식후 기록 보여 줘' },
  { icon: 'memo', text: '진료 때 물어볼 말 정리해 줘' },
  { icon: 'info', text: '식후 1시간은 언제부터 재요?' },
  { icon: 'alert', text: '이럴 땐 바로 병원에 연락하세요' },
] as const

// 위험 신호. AI 없이 정해진 안내만 보여 줌(ASK-06)
export const RISK_KEYWORDS = [
  '출혈',
  '피가',
  // '커피'에 걸리지 않게 '피' 단독은 빼고
  '피 비',
  '피나',
  '태동',
  '두통',
  '복통',
  '배가 아',
  '배가 뭉',
  '경련',
  '양수',
  '숨이 차',
  '어지러',
  '바로 병원',
]

// 물어볼 말 정리 요청
export const DRAFT_KEYWORDS = ['정리', '물어볼', '병원에 가야', '가야 하', '괜찮은']

// 기록 찾기 요청
export const RECORDS_KEYWORDS = ['기록', '수치', '혈당', '보여', '높', '낮']

// 승인된 출처의 일반 정보. 여기 없으면 병원에 물어보라고 안내
export const CHAT_INFOS: ChatInfo[] = [
  {
    id: 'post-meal-start',
    keywords: [
      ['식후', '언제'],
      ['식후', '부터'],
    ],
    answer:
      '보통 첫 술을 뜬 시각부터 1시간을 재요. 병원마다 안내가 다를 수 있으니, 병원에서 들은 방법이 있으면 그걸 따라 주세요.',
    source: { label: '대한당뇨병학회 환자 안내', url: 'https://www.diabetes.or.kr' },
    followUp: '당당 알림도 식사 시작을 누른 시각부터 맞춰져요.',
  },
  {
    id: 'fasting-when',
    keywords: [
      ['공복', '언제'],
      ['공복', '재'],
    ],
    answer:
      '보통 아침에 일어나 아무것도 먹기 전에 재요. 병원마다 안내가 다를 수 있으니, 병원에서 들은 방법이 있으면 그걸 따라 주세요.',
    source: { label: '대한당뇨병학회 환자 안내', url: 'https://www.diabetes.or.kr' },
  },
]
