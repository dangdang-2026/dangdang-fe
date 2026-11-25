import type { ResourceLink, ResourceSummary } from '@/types/resource'

// Figma C-13 공식 자료. 각 기관 누리집으로 연결
export const RESOURCE_LINKS: ResourceLink[] = [
  {
    id: 'nhis-supply',
    source: '국민건강보험공단',
    title: '당뇨병 소모성 재료 지원',
    url: 'https://www.nhis.or.kr',
    domain: 'nhis.or.kr',
    checkedOn: '2026-10-19',
  },
  {
    id: 'kda-guideline',
    source: '대한당뇨병학회',
    title: '당뇨병 진료지침 2023',
    url: 'https://www.diabetes.or.kr',
    domain: 'diabetes.or.kr',
    checkedOn: '2026-10-19',
  },
  {
    id: 'kdca-gdm',
    source: '질병관리청',
    title: '국가건강정보포털 임신성 당뇨병',
    url: 'https://health.kdca.go.kr',
    domain: 'health.kdca.go.kr',
    checkedOn: '2026-10-19',
  },
]

export const RESOURCE_SUMMARIES: ResourceSummary[] = [
  {
    id: 'carbs',
    category: '식사',
    title: '탄수화물, 너무 줄이지 않기',
    description:
      '식후 수치가 높게 나와도 밥을 크게 줄이거나 끼니를 거르기 전에, 영양 상담에서 받은 양을 먼저 확인해요.',
    items: [
      '대한당뇨병학회(2025)는 임신 중에는 탄수화물을 지나치게 줄이는 것을 권하지 않는다고 설명해요.',
      '대한당뇨병학회지(2020)는 극단적인 탄수화물 제한 식이는 부적절하다고 설명해요.',
      '미국당뇨병학회(2026)는 임신 중 하루 탄수화물을 최소 175g으로 설명해요.',
    ],
    sources: [
      { label: '대한당뇨병학회 2025 진료지침', url: 'https://www.diabetes.or.kr' },
      { label: '대한당뇨병학회지 2020;21(2)', url: null },
      { label: 'ADA Standards of Care 2026', url: null },
    ],
    note: '얼마나 먹을지는 사람마다 달라요. 병원·영양사에게 받은 식사 안내가 먼저예요.',
    checkedOn: '2026-10-19',
  },
]
