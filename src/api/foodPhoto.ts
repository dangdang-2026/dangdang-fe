const MOCK_DELAY_MS = 1800
const CANDIDATE_LIMIT = 3
// 이보다 어두우면 알아보기 어려움으로 봄(0~255)
const DARK_LIMIT = 50
const SAMPLE_SIZE = 32

// 서버 연동 전 목업 후보. 사진마다 바뀌도록 파일 크기로 고름
const MOCK_CANDIDATES = [
  ['김치볶음밥', '볶음밥', '오므라이스'],
  ['함박스테이크', '불고기', '제육볶음'],
  ['비빔밥', '잡곡밥', '김밥'],
  ['닭가슴살 샐러드', '샌드위치', '플레인 요거트'],
]

// found: 1등부터 후보 3개 · unclear: 1등 확률이 기준보다 낮음(F-15)
export type FoodPhotoResult = { status: 'found'; candidates: string[] } | { status: 'unclear' }

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

// 서버 연동 전 목업. 실제로는 서버 분류 모델이 후보를 찾고 사진은 바로 지움
export async function findFoodInPhoto(photo: Blob): Promise<FoodPhotoResult> {
  const [brightness] = await Promise.all([getBrightness(photo), wait(MOCK_DELAY_MS)])
  if (brightness < DARK_LIMIT) return { status: 'unclear' }
  const candidates = MOCK_CANDIDATES[photo.size % MOCK_CANDIDATES.length]
  return { status: 'found', candidates: candidates.slice(0, CANDIDATE_LIMIT) }
}
