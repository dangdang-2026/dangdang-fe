import type { Portion } from '@/types/glucose'

// 사진 속 위치(사진 크기 대비 0~1). x·y는 왼쪽 위 모서리
export type PhotoBox = { x: number; y: number; width: number; height: number }

// 사진에서 찾은 음식 하나. 후보는 1등부터, 확률(%)은 받지 않음
export type DetectedFood = {
  id: string
  // AI가 알아보지 못한 그릇이면 빈 배열(이름으로 찾기)
  candidates: string[]
  // 사진 속 가운데 점(0~1). 한상일 때 번호 표시
  point?: { x: number; y: number }
  // 그릇 영역. 확인 시트에 그 부분만 잘라 보여 줌
  box?: PhotoBox
  // 1등 확률이 기준보다 낮음. 체크 안 한 채로 시작
  needsCheck: boolean
}

// found: 음식 1개면 F-12, 여러 개면 F-13 · unclear: 사진 전체를 알아보기 어려움(F-15)
export type FoodPhotoResult = { status: 'found'; foods: DetectedFood[] } | { status: 'unclear' }

// 한상(F-13)에서 고르는 음식 한 줄
export type TableItem = {
  id: string
  // 이름을 못 찾은 그릇은 빈 문자열(알 수 없는 음식)
  name: string
  // 그 그릇의 AI 후보(1등부터). 빠진 음식으로 더한 줄은 빈 배열
  candidates: string[]
  // 음식마다 고른 양. 반찬도 받음
  portion: Portion
  checked: boolean
  needsCheck: boolean
  // AI가 찾은 그릇인지(빠진 음식 추가는 아님)
  fromAi: boolean
  point?: { x: number; y: number }
  box?: PhotoBox
}
