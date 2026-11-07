import { apiClient } from '@/api/axios'
import { MOCK_PHOTO_RESULTS } from '@/mocks/foodPhoto'
import type { FoodPhotoResult } from '@/types/foodPhoto'

// 서버 사진 분류 API가 준비되면 false
const USE_MOCK = true
const MOCK_DELAY_MS = 1800
// 사진 분류는 일반 요청보다 오래 걸릴 수 있음
const PHOTO_TIMEOUT_MS = 20000
// 이보다 어두우면 알아보기 어려움으로 봄(0~255)
const DARK_LIMIT = 50
const SAMPLE_SIZE = 32

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

// 작게 줄여 평균 밝기만 봄
async function getBrightness(photo: Blob) {
  const bitmap = await createImageBitmap(photo)
  const canvas = document.createElement('canvas')
  canvas.width = SAMPLE_SIZE
  canvas.height = SAMPLE_SIZE
  const context = canvas.getContext('2d')
  if (!context) return 255
  context.drawImage(bitmap, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
  bitmap.close()
  const { data } = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
  let sum = 0
  for (let i = 0; i < data.length; i += 4) sum += (data[i] + data[i + 1] + data[i + 2]) / 3
  return sum / (data.length / 4)
}

async function findFoodInPhotoMock(photo: Blob): Promise<FoodPhotoResult> {
  const [brightness] = await Promise.all([getBrightness(photo), wait(MOCK_DELAY_MS)])
  if (brightness < DARK_LIMIT) return { status: 'unclear' }
  return { status: 'found', foods: MOCK_PHOTO_RESULTS[photo.size % MOCK_PHOTO_RESULTS.length] }
}

// 사진으로 음식 후보 찾기(MEAL-03). 서버가 후보를 찾은 뒤 원본을 지움. 경로는 API 확정 전 가정
export async function findFoodInPhoto(mealId: string, photo: Blob): Promise<FoodPhotoResult> {
  if (USE_MOCK) return findFoodInPhotoMock(photo)

  const form = new FormData()
  form.append('photo', photo)
  const { data } = await apiClient.post<FoodPhotoResult>(`/meals/${mealId}/photo`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: PHOTO_TIMEOUT_MS,
  })
  return data
}
