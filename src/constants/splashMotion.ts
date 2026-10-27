// K2 쿵 착지(눌림) 포즈로 버티는 시간
const LAND_HOLD_MS = 400

// Figma 스플래시 v3 K0~K6 칸별 길이. 점프(K0→K4)는 빠르게, 꼭대기 착지 반동(K4→K5)은 2초, 워드마크(K5→K6)
const STEP_MS = [350, 350, 350 + LAND_HOLD_MS, 350, 2000, 600]

// K2→K3 칸 중 버티는 비율
const LAND_HOLD = LAND_HOLD_MS / STEP_MS[2]

// 각 키프레임(K0~K6) 시작 시각
const KEY_TIMES = STEP_MS.reduce((times, ms) => [...times, times[times.length - 1] + ms], [0])

// 전체 모션 길이(K0→K6)
export const SPLASH_MOTION_MS = KEY_TIMES[KEY_TIMES.length - 1]

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)'
const EASE_SETTLE = 'cubic-bezier(0.25, 1.2, 0.5, 1)'
const EASE_IN_OUT = 'cubic-bezier(0.4, 0, 0.2, 1)'

// K0~K4 캐릭터 위치(마지막 자리 기준 중심 이동)·기울기. K5부터 제자리
const CHARACTER_KEYS = [
  { x: -404.24, y: 309.16, rotate: -30, easing: EASE_OUT },
  { x: -190.82, y: 88.5, rotate: -11.3, easing: EASE_SETTLE },
  { x: -112.66, y: 43.93, rotate: -6.5, easing: EASE_OUT },
  { x: -50.88, y: 17.18, rotate: -2.9, easing: EASE_SETTLE },
  { x: 0, y: 0, rotate: 0, easing: EASE_SETTLE },
  { x: 0, y: 0, rotate: 0, easing: 'linear' },
  { x: 0, y: 0, rotate: 0, easing: 'linear' },
]

// K 번호(소수 포함)를 전체 모션 기준 offset으로
const at = (step: number) => {
  const index = Math.floor(step)
  const time = KEY_TIMES[index] + (step - index) * (STEP_MS[index] ?? 0)
  return time / SPLASH_MOTION_MS
}

// K2에선 제자리에 버틴 뒤 K3로 출발
export const characterKeyframes: Keyframe[] = CHARACTER_KEYS.flatMap(
  ({ x, y, rotate, easing }, step) => {
    const transform = `translate(${x}px, ${y}px) rotate(${rotate}deg)`
    if (step !== 2) return [{ offset: at(step), transform, easing }]
    return [
      { offset: at(step), transform, easing: 'linear' },
      { offset: at(step + LAND_HOLD), transform, easing },
    ]
  },
)

const EASE_UP = 'cubic-bezier(0.33, 1, 0.68, 1)'
const EASE_DOWN = 'cubic-bezier(0.32, 0, 0.67, 0)'

// 꼭대기 착지 반동 높이
const TOP_RECOIL_HEIGHTS = [26]

// K2 착지 때 자리보다 더 내려앉는 깊이
const FIRST_SINK = 18

// 꼭대기 착지 반동 끝(K4→K5 칸 비율). 2초 중 앞 0.6초
const TOP_RECOIL_END = 0.3

// 서 있는 포즈로 바뀌는 시점. 반동 끝나고 내려앉은 뒤
const STAND_AT = 4.4

// 눌린 포즈 그대로 위치만 통통 올라갔다 내려옴. 구간을 높이 개수만큼 나눔. 오를 땐 감속, 떨어질 땐 가속
const recoil = (land: number, end: number, heights: number[]): Keyframe[] => {
  const span = (end - land) / heights.length
  return [
    ...heights.flatMap((height, index) => {
      const start = land + span * index
      return [
        { offset: at(start), transform: 'translateY(0)', easing: EASE_UP },
        { offset: at(start + span / 2), transform: `translateY(-${height}px)`, easing: EASE_DOWN },
      ]
    }),
    { offset: at(end), transform: 'translateY(0)' },
  ]
}

// 떨어지던 힘 그대로 자리보다 아래로 쑥 내려앉았다가, 살짝 넘쳐 올라온 뒤 제자리로
const sink = (land: number, end: number): Keyframe[] => {
  const span = end - land
  return [
    { offset: at(land), transform: 'translateY(0)', easing: EASE_OUT },
    {
      offset: at(land + span * 0.3),
      transform: `translateY(${FIRST_SINK}px)`,
      easing: 'ease-in-out',
    },
    { offset: at(land + span * 0.7), transform: 'translateY(-4px)', easing: 'ease-in-out' },
    { offset: at(end), transform: 'translateY(0)' },
  ]
}

// 점프(K0→K4)는 Figma 포즈 그대로(폴짝 포즈에 높이 140px 포함). K2 착지·꼭대기 착지 반동만 겹침
export const bounceKeyframes: Keyframe[] = [
  { offset: 0, transform: 'translateY(0)' },
  ...sink(2, 2 + LAND_HOLD),
  ...recoil(4, 4 + TOP_RECOIL_END, TOP_RECOIL_HEIGHTS),
  { offset: 1, transform: 'translateY(0)' },
]

// 포즈 i → i+1 바뀌는 시점. 기본은 이동 구간 중간, K2는 버틴 뒤 이동 중간, K4는 튀어 오를 때
const poseSwitchAt = (pose: number) => {
  if (pose === 2) return at(2 + LAND_HOLD + (1 - LAND_HOLD) / 2)
  if (pose === 4) return at(STAND_AT)
  return at(pose + 0.5)
}

// 마지막(5)은 서 있는 포즈
export const poseKeyframes = (pose: number): Keyframe[] => {
  const start = pose === 0 ? 0 : poseSwitchAt(pose - 1)
  const end = pose === 5 ? 1 : poseSwitchAt(pose)
  return [
    { offset: 0, opacity: pose === 0 ? 1 : 0, easing: 'step-end' },
    { offset: start, opacity: 1, easing: 'step-end' },
    { offset: end, opacity: pose === 5 ? 1 : 0, easing: 'step-end' },
    { offset: 1, opacity: pose === 5 ? 1 : 0 },
  ]
}

// K5→K6 워드마크 톡(55% → 100%)
export const wordmarkKeyframes: Keyframe[] = [
  { offset: 0, opacity: 0, transform: 'scale(0.55)' },
  { offset: at(5), opacity: 0, transform: 'scale(0.55)', easing: EASE_SETTLE },
  { offset: 1, opacity: 1, transform: 'scale(1)' },
]

// K5→K6 슬로건 +8px → 0 페이드 인
export const sloganKeyframes: Keyframe[] = [
  { offset: 0, opacity: 0, transform: 'translateY(8px)' },
  { offset: at(5), opacity: 0, transform: 'translateY(8px)', easing: EASE_OUT },
  { offset: 1, opacity: 1, transform: 'translateY(0)' },
]

// 모션 끝나고 잠깐 머문 뒤 언덕이 올라와 화면을 덮고, 스플래시 전체가 페이드 아웃
export const SPLASH_HOLD_MS = 400
export const HILL_RISE_MS = 700
export const SPLASH_FADE_MS = 300
export const HILL_RISE_DELAY_MS = SPLASH_MOTION_MS + SPLASH_HOLD_MS
export const SPLASH_FADE_DELAY_MS = HILL_RISE_DELAY_MS + HILL_RISE_MS
export const SPLASH_TOTAL_MS = SPLASH_FADE_DELAY_MS + SPLASH_FADE_MS

// 언덕 중심(196, 800)을 화면 중앙으로 옮기고 2.2배 키워 높이 1188px 화면까지 덮음
export const hillRiseKeyframes: Keyframe[] = [
  { opacity: 1, transform: 'translate(0, 0) scale(1)', easing: EASE_IN_OUT },
  { opacity: 1, transform: 'translate(19px, calc(50dvh - 800px)) scale(2.2)' },
]

export const splashFadeKeyframes: Keyframe[] = [{ opacity: 1, easing: EASE_OUT }, { opacity: 0 }]

// 움직임 줄이기: 걷기 없이 슬로건 페이드 300ms만
export const REDUCED_FADE: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }]
export const REDUCED_FADE_MS = 300
