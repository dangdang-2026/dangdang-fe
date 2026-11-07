import type { DetectedFood } from '@/types/foodPhoto'

// 서버 연동 전 목업 결과. 사진마다 바뀌도록 파일 크기로 하나 고름
// 위치는 사진 크기 대비 0~1, 한상은 Figma F-13 배치 그대로
export const MOCK_PHOTO_RESULTS: DetectedFood[][] = [
  [{ id: 'f1', candidates: ['김치볶음밥', '볶음밥', '오므라이스'], needsCheck: false }],
  [
    { id: 'f1', candidates: ['잡곡밥', '현미밥'], point: { x: 0.55, y: 0.35 }, needsCheck: false },
    { id: 'f2', candidates: ['된장국', '미역국'], point: { x: 0.2, y: 0.51 }, needsCheck: false },
    { id: 'f3', candidates: ['계란말이'], point: { x: 0.44, y: 0.74 }, needsCheck: false },
    {
      id: 'f4',
      candidates: ['시금치나물', '콩나물무침'],
      point: { x: 0.85, y: 0.64 },
      needsCheck: true,
    },
  ],
  [{ id: 'f1', candidates: ['함박스테이크', '불고기', '제육볶음'], needsCheck: false }],
  [
    { id: 'f1', candidates: ['비빔밥', '잡곡밥'], point: { x: 0.4, y: 0.45 }, needsCheck: false },
    { id: 'f2', candidates: ['미역국', '된장국'], point: { x: 0.8, y: 0.35 }, needsCheck: false },
    { id: 'f3', candidates: ['배추김치'], point: { x: 0.75, y: 0.75 }, needsCheck: true },
  ],
]
