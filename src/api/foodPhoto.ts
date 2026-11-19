import { apiClient, type BaseResponse } from '@/api/axios'
import { toFood, type FoodResponse } from '@/api/foods'
import type { FoodPhotoResult } from '@/types/foodPhoto'
import type { Food } from '@/types/glucose'

// 사진 분석은 일반 요청보다 오래 걸릴 수 있음
const PHOTO_TIMEOUT_MS = 20000
// 서버 권장: 긴 변 1600px 정도로 줄여 JPEG로
const MAX_SIDE = 1600
const JPEG_QUALITY = 0.85

// 백엔드 FoodImageAnalysisResponse. fallback이면 candidates=[]
type FoodImageAnalysisResponse = {
  fallback: boolean
  // 확신도 높은 순 최대 3개. foods는 그 이름으로 검색한 앞쪽 3개
  candidates: { name: string; confidence: number; foods: FoodResponse[] }[]
}

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
  const foods = analysis.candidates.flatMap((candidate) =>
    candidate.foods.length > 0 ? [toFood(candidate.foods[0])] : [],
  )
  const names = [...new Set(foods.map((food) => food.name))]
  if (analysis.fallback || names.length === 0) return { result: { status: 'unclear' }, foods: [] }
  // 서버는 음식 하나만 찾음. 1등 확신도가 낮으면 fallback으로 와서 바로 골라 둠
  return {
    result: { status: 'found', foods: [{ id: 'photo', candidates: names, needsCheck: false }] },
    foods,
  }
}
