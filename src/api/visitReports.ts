import { apiClient, type BaseResponse } from '@/api/axios'
import { parseDateKey } from '@/utils/date'

// 리포트 종류. 진료용은 진료 일정 기준, 기간 직접은 고른 기간
type ReportKind = 'VISIT' | 'CUSTOM'

// 백엔드 VisitReportResponse 중 기간 · 병원만. 내용은 기기 기록으로 그림
type VisitReportPeriodResponse = {
  // yyyy-MM-dd, 둘 다 포함
  from: string
  to: string
  // 그 진료 일정의 병원. 없거나 지웠으면 null
  careSite: { careSiteId: number; name: string } | null
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
  return { from, to, careSiteName: data.data?.careSite?.name ?? null }
}

// 리포트 저장. 같은 리포트가 이미 있으면 서버가 새로 만들지 않고 그 id를 줌
export async function saveVisitReport(body: VisitReportSave) {
  const { data } = await apiClient.post<BaseResponse<{ id: number }>>('/visit-reports', body)
  if (!data.data) throw new Error('리포트 저장 응답이 비어 있음')
  return data.data.id
}

// 백엔드 VisitReportPageResponse.Item. 진료용 기간 · 병원은 지금 진료 일정으로 다시 계산돼 옴
type VisitReportItem = {
  id: number
  kind: ReportKind
  // yyyy-MM-dd. 진료 날짜가 미정이면 null
  from: string | null
  to: string | null
  visitId: number | null
  careSiteId: number | null
  careSiteName: string | null
  // yyyy-MM-dd. 진료용만
  visitDate: string | null
  summary: { measured: number; inTargetRate: number | null; compared: boolean } | null
  createdAt: string
}

type VisitReportPage = { items: VisitReportItem[]; page: number; size: number; hasNext: boolean }

// 지난 리포트 한 줄. 숫자는 서버가 볼 때마다 다시 계산
export type SavedReport = {
  id: string
  from: string
  to: string
  // 병원이 없거나 지웠으면 빈 글 · null
  hospital: string
  careSiteId: string | null
  // 진료용이면 그 진료 일정 · 날짜
  visitId: string | null
  visitDate: string | null
  custom: boolean
  measured: number
  // 목표 안 비율 0~1. 목표와 비교한 기록이 없으면 null(기준 받기 전)
  inTargetRate: number | null
  createdAt: string
}

// 한 번에 받는 수(서버 상한 100)와 안전장치 쪽 수(1만 개)
const PAGE_SIZE = 100
const MAX_PAGES = 100

// 지난 리포트 전부. 최근 저장 순, 기간을 모르는(진료 날짜 미정) 리포트는 열 수 없어 뺌
export async function getVisitReports() {
  const items: VisitReportItem[] = []
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { data } = await apiClient.get<BaseResponse<VisitReportPage>>('/visit-reports', {
      params: { page, size: PAGE_SIZE },
    })
    // 이미 받은 리포트는 빼고 더함. 빈 쪽이나 같은 쪽이 다시 오면 그만 받음
    const fresh = (data.data?.items ?? []).filter(
      (item) => !items.some((seen) => seen.id === item.id),
    )
    items.push(...fresh)
    if (!data.data?.hasNext || fresh.length === 0) break
  }
  return items.flatMap((item): SavedReport[] =>
    item.from && item.to
      ? [
          {
            id: String(item.id),
            from: item.from,
            to: item.to,
            hospital: item.careSiteName ?? '',
            careSiteId: item.careSiteId === null ? null : String(item.careSiteId),
            visitId: item.visitId === null ? null : String(item.visitId),
            visitDate: item.visitDate,
            custom: item.kind === 'CUSTOM',
            measured: item.summary?.measured ?? 0,
            inTargetRate: item.summary?.compared ? item.summary.inTargetRate : null,
            createdAt: item.createdAt,
          },
        ]
      : [],
  )
}
