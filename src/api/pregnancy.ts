import { apiClient, type BaseResponse } from '@/api/axios'

// 백엔드 PregnancyState. ENDED는 끝난 임신이라 /me에 안 옴, PAUSED는 다른 상황이라 측정 알림만 멈춤
export type PregnancyState = 'PREGNANT' | 'HOSPITALIZED' | 'POSTPARTUM' | 'PAUSED' | 'ENDED'

// 백엔드 PregnancyStateResponse. pausedReminders는 이번에 멈춘 예정 측정 알림 수
type PregnancyStateResponse = {
  state: PregnancyState
  deliveryDate: string | null
  pausedReminders: number
}

// 입원(true) · 다시 켜기(false). 입원하면 서버가 예정 측정 알림을 멈춤
export async function updateHospitalization(hospitalized: boolean) {
  const { data } = await apiClient.patch<BaseResponse<PregnancyStateResponse>>(
    '/me/hospitalization',
    { hospitalized },
  )
  if (!data.data) throw new Error('입원 상태 응답이 비어 있음')
  return data.data
}

// 다른 상황이에요(true) · 다시 켜기(false). 멈추면 서버가 예정 측정 알림을 취소. 멈춘 상태가 아닌데 켜면 409 PREGNANCY_40901
export async function updateMeasurementPause(paused: boolean) {
  const { data } = await apiClient.patch<BaseResponse<PregnancyStateResponse>>(
    '/me/measurement-pause',
    { paused },
  )
  if (!data.data) throw new Error('측정 알림 멈춤 응답이 비어 있음')
  return data.data
}

// 출산일(YYYY-MM-DD, 오늘까지) 저장 → 산후 모드. 서버가 예정 측정 알림을 멈춤
export async function updateDeliveryDate(deliveryDate: string) {
  const { data } = await apiClient.patch<BaseResponse<PregnancyStateResponse>>(
    '/me/delivery-date',
    { deliveryDate },
  )
  if (!data.data) throw new Error('출산일 응답이 비어 있음')
  return data.data
}

// 백엔드 GraduationResponse. 저장한 혈당 수 · 가입한 날부터 함께한 주
export type GraduationStats = { keptMeasurements: number; weeksTogether: number }

// 졸업. 임신이 끝남(ENDED)이 돼서 뒤로는 산후 홈 · 검사 API를 못 씀. 산후가 아니면 409
export async function graduate() {
  const { data } = await apiClient.post<BaseResponse<GraduationStats>>('/me/graduation')
  if (!data.data) throw new Error('졸업 응답이 비어 있음')
  return data.data
}
