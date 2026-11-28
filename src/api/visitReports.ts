import { apiClient, type BaseResponse } from '@/api/axios'
import { fromServerInsulin, type ServerInsulinType } from '@/api/insulin'
import type { ServerMealSlot } from '@/api/meals'
import { fromServerReading, type ReadingType, type ServerSlot } from '@/api/readings'
import type { MeasureSlotKey } from '@/types/criteria'
import { parseDateKey } from '@/utils/date'
import type { ReportMissed, ServerReport } from '@/utils/report'

// 리포트 종류. 진료용은 진료 일정 기준, 기간 직접은 고른 기간
type ReportKind = 'VISIT' | 'CUSTOM'

// 백엔드 VisitReportResponse. 볼 때마다 서버가 다시 계산(횟수 · 원값만)
type VisitReportPeriodResponse = {
  // yyyy-MM-dd, 둘 다 포함
  from: string
  to: string
  // 그 진료 일정의 병원. 없거나 지웠으면 null
  careSite: { careSiteId: number; name: string } | null
  summary?: {
    measured: number
    missed: number
    enteredLate: number
    below70: number
    above200: number
  }
  slots?: { slot: string | null; measured?: number; outOfTarget?: number; missed: number }[]
  missedCells?: { date: string; slot: string }[]
  // 원값 표. 잰 시각 오래된 순
  readings?: {
    readingId: number
    measuredAt: string
    readingType: ReadingType
    slot: ServerSlot | null
    value: number
    meterLimit: 'HI' | 'LO' | null
    aboveTarget: boolean | null
    // 잰 뒤 30분 넘어 적음(나중 입력)
    enteredLate: boolean
    expectedAt: string | null
    timing: 'EARLY' | 'ON_TIME' | 'LATE' | null
  }[]
  // 원값 표 · 인슐린. 맞은 시각 오래된 순
  insulinLogs?: {
    insulinLogId: number
    takenAt: string
    insulinType: ServerInsulinType
    mealSlot: ServerMealSlot | null
    units: number
    edited: boolean
  }[]
}

// 서버 리포트 본문 → 화면 리포트 재료. 원값 표 칸이 없는 예전 응답이면 null(기기 기록으로 그림)
function toServerReport(report: VisitReportPeriodResponse): ServerReport | null {
  if (!report.readings || !report.summary) return null
  return {
    records: report.readings.map((row) =>
      fromServerReading({ ...row, mealId: null, targetValue: null }),
    ),
    lateEntryIds: new Set(
      report.readings.filter((row) => row.enteredLate).map((row) => String(row.readingId)),
    ),
    measured: report.summary.measured,
    lateEntries: report.summary.enteredLate,
    slotCounts: Object.fromEntries(
      (report.slots ?? []).flatMap((item) => {
        const key = item.slot ? SLOT_KEY[item.slot] : undefined
        return key
          ? [[key, { measured: item.measured ?? 0, outOfTarget: item.outOfTarget ?? 0 }]]
          : []
      }),
    ),
    insulins: (report.insulinLogs ?? []).map((log) =>
      fromServerInsulin({ ...log, editedAt: log.edited ? log.takenAt : null }),
    ),
  }
}

// 백엔드 MeasureSlot → 리포트 잴 때
const SLOT_KEY: Record<string, MeasureSlotKey> = {
  FASTING: 'fasting',
  BREAKFAST_AFTER: 'breakfast',
  LUNCH_AFTER: 'lunch',
  DINNER_AFTER: 'dinner',
  BEDTIME: 'bedtime',
}

// 서버 빈칸 → 리포트 빈칸. 서버가 빈칸 칸을 안 주는 응답이면 null(기기에서 계산)
function toReportMissed(report: VisitReportPeriodResponse): ReportMissed | null {
  if (!report.summary || !report.missedCells) return null
  const bySlot: ReportMissed['bySlot'] = {}
  for (const item of report.slots ?? []) {
    const key = item.slot ? SLOT_KEY[item.slot] : undefined
    if (key) bySlot[key] = item.missed
  }
  const cells = new Set(
    report.missedCells.flatMap((cell) =>
      SLOT_KEY[cell.slot] ? [cell.date + '|' + SLOT_KEY[cell.slot]] : [],
    ),
  )
  return { total: report.summary.missed, bySlot, cells }
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
  const careSite = data.data?.careSite ?? null
  return {
    from,
    to,
    careSiteName: careSite?.name ?? null,
    careSiteId: careSite ? String(careSite.careSiteId) : null,
    missed: data.data ? toReportMissed(data.data) : null,
    server: data.data ? toServerReport(data.data) : null,
  }
}

// 저장한 리포트 한 장. 다시 열 때 서버가 지금 기록으로 다시 계산한 빈칸 · 원값
export async function getSavedReport(reportId: string) {
  const { data } = await apiClient.get<BaseResponse<VisitReportPeriodResponse>>(
    `/visit-reports/${reportId}`,
  )
  return {
    missed: data.data ? toReportMissed(data.data) : null,
    server: data.data ? toServerReport(data.data) : null,
  }
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
  summary: {
    measured: number
    inTargetRate: number | null
    outOfTarget?: number
    compared: boolean
  } | null
  createdAt: string
}

type VisitReportPage = {
  items: VisitReportItem[]
  page: number
  size: number
  hasNext: boolean
  // 저장한 리포트 전체 수(날짜 미정 포함)
  totalCount?: number
}

// 지난 리포트 한 줄. 숫자는 서버가 볼 때마다 다시 계산
export type SavedReport = {
  id: string
  // 진료 날짜가 미정이면 null(열 수 없음)
  from: string | null
  to: string | null
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
  // 목표 밖 횟수(그때 기준으로 서버가 셈)
  outOfTarget: number
  createdAt: string
}

// 한 번에 받는 수(서버 상한 100)와 안전장치 쪽 수(1만 개)
const PAGE_SIZE = 100
const MAX_PAGES = 100

// 저장한 리포트 수. 한 줄만 받아 전체 수만 봄
export async function getVisitReportCount() {
  const { data } = await apiClient.get<BaseResponse<VisitReportPage>>('/visit-reports', {
    params: { page: 0, size: 1 },
  })
  if (typeof data.data?.totalCount !== 'number') throw new Error('리포트 수 응답이 비어 있음')
  return data.data.totalCount
}

// 지난 리포트 전부. 최근 저장 순, 진료 날짜 미정 리포트도 목록에(열 수는 없음)
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
            outOfTarget: item.summary?.outOfTarget ?? 0,
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
      : item.kind === 'VISIT'
        ? [
            {
              id: String(item.id),
              from: null,
              to: null,
              hospital: item.careSiteName ?? '',
              careSiteId: item.careSiteId === null ? null : String(item.careSiteId),
              visitId: item.visitId === null ? null : String(item.visitId),
              visitDate: null,
              custom: false,
              measured: 0,
              inTargetRate: null,
              outOfTarget: 0,
              createdAt: item.createdAt,
            },
          ]
        : [],
  )
}
