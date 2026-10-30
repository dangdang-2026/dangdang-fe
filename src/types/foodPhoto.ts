// 사진에서 찾은 음식 하나. 후보는 1등부터, 확률(%)은 받지 않음
export type DetectedFood = {
  id: string
  candidates: string[]
  // 사진 속 위치(사진 크기 대비 0~1). 한상일 때 번호 표시
  point?: { x: number; y: number }
  // 1등 확률이 기준보다 낮음. 체크 안 한 채로 시작
  needsCheck: boolean
}

// found: 음식 1개면 F-12, 여러 개면 F-13 · unclear: 사진 전체를 알아보기 어려움(F-15)
export type FoodPhotoResult = { status: 'found'; foods: DetectedFood[] } | { status: 'unclear' }
