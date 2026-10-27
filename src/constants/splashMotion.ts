// Figma 스플래시 v3 K0~K6. Smart Animate 한 칸 300ms를 2배로 늦춤
export const SPLASH_STEP_MS = 600

// 전체 모션 길이(K0→K6)
export const SPLASH_MOTION_MS = SPLASH_STEP_MS * 6

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

const at = (step: number) => (step * SPLASH_STEP_MS) / SPLASH_MOTION_MS

export const characterKeyframes: Keyframe[] = CHARACTER_KEYS.map(
  ({ x, y, rotate, easing }, step) => ({
    offset: at(step),
    transform: `translate(${x}px, ${y}px) rotate(${rotate}deg)`,
    easing,
  }),
)

const EASE_RISE = 'cubic-bezier(0.33, 1, 0.68, 1)'
const EASE_FALL = 'cubic-bezier(0.32, 0, 0.67, 0)'

// K0~K4 한 칸마다 한 번씩 통통. 마지막(K4→K5)은 제자리에서 작게
const HOP_HEIGHTS = [28, 28, 24, 20, 12]

// 이동 경로 위에 겹치는 점프. 착지 때 납작, 공중에선 길쭉
export const hopKeyframes: Keyframe[] = [
  ...HOP_HEIGHTS.flatMap((height, step) => [
    { offset: at(step), transform: 'translateY(0) scale(1.12, 0.86)', easing: EASE_RISE },
    {
      offset: at(step + 0.5),
      transform: `translateY(-${height}px) scale(0.95, 1.06)`,
      easing: EASE_FALL,
    },
  ]),
  { offset: at(5), transform: 'translateY(0) scale(1.1, 0.88)', easing: EASE_SETTLE },
  { offset: at(5.4), transform: 'translateY(0) scale(1)' },
  { offset: 1, transform: 'translateY(0) scale(1)' },
]

// 포즈 i는 앞뒤 키프레임의 중간 지점에서 바뀜. 마지막(5)은 서 있는 포즈
export const poseKeyframes = (pose: number): Keyframe[] => {
  const start = pose === 0 ? 0 : at(pose - 0.5)
  const end = pose === 5 ? 1 : at(pose + 0.5)
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

export const splashFadeKeyframes: Keyframe[] = [
  { opacity: 1, easing: EASE_OUT },
  { opacity: 0 },
]

// 움직임 줄이기: 걷기 없이 슬로건 페이드 300ms만
export const REDUCED_FADE: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }]
export const REDUCED_FADE_MS = 300
