// 투어 단계마다 뒤에 깔리는 화면
export type TourStage = 'home-before' | 'home-eating' | 'glucose' | 'visit'

// 스포트라이트 대상. 선택자 또는 버튼 글자로 찾음
export type TourTarget = { selector: string } | { text: string }

export type TourStep = {
  stage: TourStage
  target: TourTarget
  title: string
  description: string
  // 대상과 고리 사이 여백(px). 없으면 6
  pad?: number
  // 대상에 둥근 모서리가 없을 때 쓸 반지름(px)
  radius?: number
}

// Figma A-05b~A-05g 가이드 투어 6단계
export const TOUR_STEPS: TourStep[] = [
  {
    stage: 'home-before',
    target: { text: '식사 시작' },
    title: '식사 시작은 여기서!',
    description: '식사를 시작할 때 버튼을 눌러 주세요. 먹은 음식은 나중에 기록해도 괜찮아요.',
  },
  {
    stage: 'home-eating',
    target: { selector: '[data-tour="hero"] > section' },
    title: '병원 기준에 맞춰 알려드려요!',
    description:
      '병원에서 안내받은 식후 1시간·2시간 기준에 맞춰 측정 시간을 알려드려요. 언제든 변경할 수 있어요.',
  },
  {
    stage: 'home-eating',
    target: { selector: 'button[aria-label^="알림"]' },
    title: '측정 시간, 놓치지 마세요!',
    description: '아이폰은 홈 화면에 추가하고 알림을 허용하면 안내를 받을 수 있어요.',
  },
  {
    stage: 'home-eating',
    target: { text: '지금 입력' },
    title: '혈당 수치만 입력해 주세요!',
    description: '조금 늦게 측정해도 괜찮아요. 실제 측정한 시각으로 기록돼요.',
  },
  {
    stage: 'glucose',
    target: { selector: '[data-tour="glucose-result"]' },
    title: '내 목표 혈당과 비교해요!',
    description:
      '설정한 목표 범위와 비교해 결과를 보여 드려요. 판단과 조절은 의료진과 상의해 주세요.',
    radius: 20,
  },
  {
    stage: 'visit',
    target: { text: '진료 리포트 만들기' },
    title: '진료 때 보여 줄 기록, 한 장으로!',
    description: '의료진에게 바로 보여 주거나 PDF로 저장할 수 있어요.',
    pad: 12,
    radius: 12,
  },
]
