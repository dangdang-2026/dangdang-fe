import { apiClient, type BaseResponse } from '@/api/axios'

// 제한 사유(신고 사유와 같은 값) → 화면 문구
const REASON_LABEL: Record<string, string> = {
  MEDICAL_ADVICE: '진단·처방, 약 이름·용량 권유',
  NUMBER_COMPARE: '혈당 수치 비교·순위',
  AD_SALES: '광고·판매·후원 요청',
  PRIVACY: '개인정보 노출',
  ABUSE: '비방·혐오·성적인 글',
}

// 이용 제한. until이 null이면 운영자가 풀 때까지
export type Restriction = { until: string | null; reason: string | null }

// 내 이용 제한(U-17). 제한 중이 아니면 null
export async function getRestriction(): Promise<Restriction | null> {
  const { data } =
    await apiClient.get<
      BaseResponse<{ restricted: boolean; reason: string | null; endsAt: string | null }>
    >('/community/restriction')
  const item = data.data
  if (!item?.restricted) return null
  return { until: item.endsAt, reason: item.reason ? (REASON_LABEL[item.reason] ?? null) : null }
}
