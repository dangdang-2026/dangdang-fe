export type MealType = 'breakfast' | 'lunch' | 'dinner'

// 측정 시점: 공복 · 식후 · 자기 전
export type MeasureSlot = 'fasting' | 'post-meal' | 'bedtime'

export type Meal = {
  id: string
  type: MealType
  startedAt: string
  // 서버에 아직 못 보낸 식사. 알림 예약 안 됨
  pending?: boolean
  // 이번 끼니 식후 측정 건너뜀
  skipped: boolean
  // 먹은 음식 이름. 적기 전엔 없음
  foods?: string[]
  // 주식(밥·면 등) 양. 반찬은 양을 받지 않음
  portion?: Portion
  // 주식을 그램으로 적었으면 그 무게. 있으면 portion보다 먼저 씀
  stapleGrams?: number
  // 음식 이름별 내가 잰 영양값(F-18). 없으면 식약처 참고값
  nutritionEdits?: NutritionEdits
  // 사진으로 찾은 AI 후보 이름(D-09 고치기에서 다시 보여 줌). 사진은 보관 안 함
  aiCandidates?: string[]
  // 한상에서 음식마다 고른 양(F-13)
  portions?: Record<string, Portion>
  // 고친 음식을 서버 항목에 아직 못 맞춤. 동기화 때 다시 보냄
  itemsPending?: boolean
  // 건너뛰기를 서버에 아직 못 보냄. 동기화 때 다시 보냄
  skipPending?: boolean
}

// 양: 반 · 1 · 1.5
export type Portion = 'half' | 'one' | 'one-half'

// 음식 하나. unit은 양 표시 단위(공기·인분 등)
export type Food = {
  // 식약처 식품코드. 서버 음식만 있음
  code?: string
  name: string
  unit: string
  // 밥·면처럼 식후 혈당에 영향이 큰 주식. 이것만 양을 받음
  staple?: boolean
  // 1인분 영양 참고값(식약처 DB)
  nutrition?: Nutrition
}

// 1인분 기준. grams는 1인분 무게
export type Nutrition = {
  grams: number
  kcal: number
  carbs: number
  sugar: number
  protein: number
  fat: number
}

// 내가 잰 무게·영양성분표로 고친 값. 먹은 양 전체 기준, 영양성분표로 적으면 무게 없음
export type NutritionEdit = Omit<Nutrition, 'grams'> & {
  grams?: number
  editedAt: string
}

export type NutritionEdits = Record<string, NutritionEdit>

// 사용자가 직접 추가한 음식
export type MyFood = Food & {
  // 영양 참고값 기준으로 쓸 비슷한 음식
  similarTo?: string
  // 자주 먹는 양. 주식일 때만
  portion?: Portion
  // 서버 내 음식 id. 아직 못 보냈으면 없음
  serverId?: number
  // 고친 내용을 서버에 아직 못 보냄
  pending?: boolean
}

export type GlucoseRecord = {
  id: string
  slot: MeasureSlot
  value: number
  measuredAt: string
  // 실제로 입력한 시각. 측정 시각과 차이가 크면 리포트에 "나중 입력"
  enteredAt?: string
  // 식후 측정이면 연결된 끼니
  mealId?: string
  mealType?: MealType
  // 고친 시각. 리포트에 "수정됨" 표시
  editedAt?: string
  // 처음 입력한 값(수정 전후 기록용)
  original?: { value: number; measuredAt: string }
  // 서버가 붙인 잰 날짜의 병원 기준 id
  criteriaId?: number
  // 서버 판정. undefined면 서버 값을 아직 못 받음(화면이 기준으로 계산), null이면 서버가 판정 안 함(목표 · 재야 할 시각 없음)
  targetValue?: number | null
  aboveTarget?: boolean | null
  expectedAt?: string | null
  timing?: ReadingTiming | null
  // 서버가 남긴 처음 값. 값을 안 고쳤거나 처음 값으로 되돌렸으면 null
  originalValue?: number | null
  originalMeterLimit?: MeterLimit | null
  // 혈당계에 HI · LO가 떠서 그 글자로 적음. value에는 혈당계 끝값(HI 600 · LO 20)
  meterLimit?: MeterLimit | null
}

// 백엔드 ReadingTiming. 재야 할 시각과 비교(±15분)
export type ReadingTiming = 'EARLY' | 'ON_TIME' | 'LATE'

// 백엔드 MeterLimit. 혈당계가 잴 수 없을 만큼 높음 · 낮음
export type MeterLimit = 'HI' | 'LO'

// 입력 시트에 넘기는 측정 시점 정보
export type MeasureTarget = {
  slot: MeasureSlot
  mealId?: string
  mealType?: MealType
  // 식후 측정 예정 시각
  dueAt?: string
}

export type TargetComparison = 'in-range' | 'high' | 'off' | 'invalid'

// 인슐린 종류: 식사 때(속효성) · 자기 전(지속형). custom은 서버 연동 전 기기에만 남은 직접 적기
export type InsulinKind = 'meal' | 'bedtime' | 'custom'

// 인슐린 모드에서 맞은 기록. 알림 없이 기록만
export type InsulinRecord = {
  id: string
  kind: InsulinKind
  // 식사 때 인슐린의 끼니. 서버 연동 전 기록엔 없음
  mealType?: MealType
  // 직접 적은 이름. kind가 custom일 때만
  name?: string
  units: number
  takenAt: string
  editedAt?: string
  // 서버에 저장된 기록. 없으면 기기에만 있는 예전 기록
  server?: boolean
}
