// API 연동 전 임시 사용자 정보
export const MOCK_USER = {
  name: '지수',
  // 병원에서 들은 식후 측정 시점(시간). 모르면 null
  postMealHours: 1,
  // 병원에서 들은 목표(mg/dL 미만). 비우면 비교 안 함
  targets: {
    fasting: 95 as number | null,
    postMeal: 140 as number | null,
  },
}
