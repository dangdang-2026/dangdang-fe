import { apiClient, type BaseResponse } from '@/api/axios'
import { parseDateKey } from '@/utils/date'

// 리포트 종류. 진료용은 진료 일정 기준, 기간 직접은 고른 기간
type ReportKind = 'VISIT' | 'CUSTOM'

// 백엔드 VisitReportResponse 중 기간만. 내용은 기기 기록으로 그림
type VisitReportPeriodResponse = {
  // yyyy-MM-dd, 둘 다 포함
  from: string
  to: string
}

// 백엔드 VisitReportCreateRequest. 진료용은 visitId만, 기간 직접은 기간 · 병원
export type VisitReportSave =
  | { kind: Extract<ReportKind, 'VISIT'>; visitId: number }
  | { kind: Extract<ReportKind, 'CUSTOM'>; from: string; to: string; careSiteId?: number }

// 이번 진료 리포트 기간. 서버가 지난 진료일(없으면 첫 기록) ~ 진료 전날로 계산, 날짜 미정이면 VISIT_40003
export async function getVisitReportPeriod(visitId: string) {
  const { data } = await apiClient.get<BaseResponse<VisitReportPeriodResponse>>(
    `/visits/${visitId}/report`,
  )
  const from = parseDateKey(data.data?.from ?? null)
  const to = parseDateKey(data.data?.to ?? null)
  if (!from || !to) throw new Error('진료 리포트 기간이 비어 있음')
  return { from, to }
}

// 리포트 저장. 같은 리포트가 이미 있으면 서버가 새로 만들지 않고 그 id를 줌
export async function saveVisitReport(body: VisitReportSave) {
  const { data } = await apiClient.post<BaseResponse<{ id: number }>>('/visit-reports', body)
  if (!data.data) throw new Error('리포트 저장 응답이 비어 있음')
  return data.data.id
}
