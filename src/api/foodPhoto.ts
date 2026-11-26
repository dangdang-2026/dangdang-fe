import { apiClient, type BaseResponse } from '@/api/axios'
import { toFood, type FoodResponse } from '@/api/foods'
import type { DetectedFood, FoodPhotoResult } from '@/types/foodPhoto'
import type { Food } from '@/types/glucose'

// 사진 분석은 일반 요청보다 오래 걸릴 수 있음
const PHOTO_TIMEOUT_MS = 20000
// 서버 권장: 긴 변 1600px 정도로 줄여 JPEG로
const MAX_SIDE = 1600
const JPEG_QUALITY = 0.85

type Candidate = { name: string; confidence: number; foods: FoodResponse[] }

// 백엔드 FoodImageAnalysisResponse. fallback이면 candidates=[]
type FoodImageAnalysisResponse = {
  fallback: boolean
  // 확신도 높은 순 최대 3개. foods는 그 이름으로 검색한 앞쪽 3개
  candidates: Candidate[]
  // 그릇마다 위치 · 후보(최대 6개), 확신 낮은 그릇만 fallback. 지금 AI는 1개 · 위치 없음, 예전 서버엔 없음
  items?: {
    box: { x: number; y: number; width: number; height: number } | null
    point: { x: number; y: number } | null
    fallback: boolean
    candidates: Candidate[]
  }[]
}

// 후보마다 식약처 음식 1등만. 못 찾은 후보는 뺌
const toFoods = (candidates: Candidate[]) =>
  candidates.flatMap((candidate) =>
    candidate.foods.length > 0 ? [toFood(candidate.foods[0])] : [],
  )

const namesOf = (foods: Food[]) => [...new Set(foods.map((food) => food.name))]

// 긴 변을 줄이고 JPEG로 바꿈(HEIC 포함). 브라우저가 못 열면 원본 그대로
async function shrinkPhoto(photo: Blob) {
  try {
    const bitmap = await createImageBitmap(photo)
    const context = document.createElement('canvas').getContext('2d')
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = context?.canvas
    if (!context || !canvas) {
      bitmap.close()
      return photo
    }
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const jpeg = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    )
    return jpeg ?? photo
  } catch {
    return photo
  }
}

// 사진으로 음식 후보 찾기(MEAL-03). 서버는 사진을 저장하지 않음
// 후보마다 식약처 음식 1등만 칩으로, 못 찾은 후보는 뺌. AI_PHOTO 동의가 없으면 403 FOOD_40301
export async function findFoodInPhoto(
  photo: Blob,
): Promise<{ result: FoodPhotoResult; foods: Food[] }> {
  const form = new FormData()
  form.append('image', await shrinkPhoto(photo), 'photo.jpg')
  const { data } = await apiClient.post<BaseResponse<FoodImageAnalysisResponse>>(
    '/foods/analyze-image',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: PHOTO_TIMEOUT_MS },
  )
  const analysis = data.data
  if (!analysis) throw new Error('사진 분석 응답이 비어 있음')
  // 그릇마다 음식 후보. 이름을 못 찾은 그릇은 후보 없이 확인 필요(F-13c)
  const detected = (analysis.items ?? []).map((item, index) => {
    const foods = item.fallback ? [] : toFoods(item.candidates)
    // 음식 DB에 없는 후보도 이름은 남김(그 이름으로 적음)
    const names = item.fallback
      ? []
      : [
          ...new Set(
            item.candidates.map((candidate) =>
              candidate.foods.length > 0 ? toFood(candidate.foods[0]).name : candidate.name,
            ),
          ),
        ]
    const { box } = item
    const food: DetectedFood = {
      id: `photo-${index}`,
      candidates: names,
      // 가운데 점이 없으면 영역 가운데
      point:
        item.point ?? (box ? { x: box.x + box.width / 2, y: box.y + box.height / 2 } : undefined),
      box: box ?? undefined,
      needsCheck: names.length === 0,
    }
    return { food, foods }
  })
  // 이름을 하나라도 찾은 그릇이 있어야 결과 화면. 그릇이 하나면 F-12, 여러 개면 F-13
  if (detected.some(({ food }) => food.candidates.length > 0)) {
    return {
      result: { status: 'found', foods: detected.map(({ food }) => food) },
      foods: detected.flatMap(({ foods }) => foods),
    }
  }
  // items가 없는 예전 서버 · 그릇을 하나도 못 알아봄: 사진 전체 후보로
  const foods = toFoods(analysis.candidates)
  const names = namesOf(foods)
  if (analysis.fallback || names.length === 0) return { result: { status: 'unclear' }, foods: [] }
  return {
    result: { status: 'found', foods: [{ id: 'photo', candidates: names, needsCheck: false }] },
    foods,
  }
}
