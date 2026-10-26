// 당당 소식 카드뉴스. 운영팀 검수 전 임시 문구
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
}

export const MOCK_NEWS: NewsCard[] = [
  {
    id: 'postpartum-test',
    series: '출산 후에도',
    title: '출산 후 첫 혈당 검사, 언제 받나요?',
    sources: ['대한당뇨병학회', '미국당뇨병학회(ADA)', '영국 NICE'],
    checkedAt: '2026-10-19',
    slides: [
      {
        eyebrow: '출산 후에도',
        headline: '출산 후에도 혈당 검사를 이어 가요',
        body: '임신성 당뇨는 출산 뒤 대부분 좋아지지만, 나중을 위해 검사를 이어 가요.',
      },
      {
        eyebrow: '지침은 이렇게 말해요',
        source: '미국당뇨병학회(ADA)',
        headline: '출산 후 4~12주에 75g 경구 포도당 부하 검사',
        body: '그 뒤에도 1~3년마다 검사를 이어 가도록 설명해요.',
      },
      {
        eyebrow: '지침은 이렇게 말해요',
        source: '영국 NICE',
        headline: '출산 후 6~13주에 공복 혈당 검사',
        body: '나라마다 검사 시기와 방법이 조금씩 달라요.',
      },
      {
        eyebrow: '정리해요',
        headline: '내 검사 일정은 다니는 병원에 물어봐 주세요',
        body: '진료 때 물어볼 것에 적어 두면 잊지 않아요.',
      },
    ],
    questions: [
      '제 병원에서는 출산 후 언제, 어떤 혈당 검사를 하나요?',
      '검사 전에 공복이나 준비할 것이 있나요?',
    ],
  },
  {
    id: 'carbs',
    series: '지침은 이렇게 말해요',
    title: '탄수화물, 무조건 줄이면 될까요?',
    sources: ['미국당뇨병학회(ADA)', '대한당뇨병학회', '대한영양사협회'],
    checkedAt: '2026-10-19',
    slides: [
      {
        eyebrow: '지침은 이렇게 말해요',
        headline: '탄수화물을 아예 끊지는 않아요',
        body: '엄마와 아기에게 필요한 에너지라서 알맞게 나눠 먹는 게 중요해요.',
      },
      {
        eyebrow: '지침은 이렇게 말해요',
        source: '미국당뇨병학회(ADA)',
        headline: '임신 중 하루 탄수화물 최소 175g',
        body: '이보다 적게 먹지 않도록 설명해요.',
      },
      {
        eyebrow: '정리해요',
        headline: '얼마나 먹을지는 영양 상담에서 정해요',
        body: '내 몸에 맞는 양은 병원에서 함께 정해 주세요.',
      },
    ],
    questions: ['하루에 탄수화물을 얼마나 먹으면 되나요?', '간식은 언제, 얼마나 먹으면 좋을까요?'],
  },
]
