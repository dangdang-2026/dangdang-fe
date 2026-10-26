// Figma 스플래시 v3 K0~K6. Smart Animate 한 칸 300ms
export const SPLASH_STEP_MS = 300

// 전체 모션 길이(K0→K6)
export const SPLASH_MOTION_MS = SPLASH_STEP_MS * 6

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)'
const EASE_SETTLE = 'cubic-bezier(0.25, 1.2, 0.5, 1)'

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

// 움직임 줄이기: 걷기 없이 슬로건 페이드 300ms만
export const REDUCED_FADE: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }]
export const REDUCED_FADE_MS = 300
