import { isAxiosError } from 'axios'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  getVisitReports,
  saveVisitReport,
  type SavedReport,
  type VisitReportSave,
} from '@/api/visitReports'
import { useHospitalStore } from '@/stores/useHospitalStore'

export type { SavedReport }

// 못 보낸 저장. 예전 기기 리포트는 병원 이름만 있어 보낼 때 번호로 바꿈
type PendingSave = VisitReportSave & { hospitalName?: string }

type ReportState = {
  reports: SavedReport[]
  // 못 보낸 리포트 저장. 다음 목록 맞출 때 다시 보냄
  pending: PendingSave[]
  // 보낼 목록 주인 계정. 예전 기기 리포트는 주인을 몰라 null
  ownerId: number | null
}

// v0 기기 저장 리포트. 서버엔 진료 일정 번호가 없어 기간 직접으로 올림
type LegacyReport = { from?: string; to?: string; hospital?: string }

// 서버 지난 리포트를 기기에도 둠. 오프라인 · 화면 처음에 바로 보이게
export const useReportStore = create<ReportState>()(
  persist((): ReportState => ({ reports: [], pending: [], ownerId: null }), {
    name: 'dangdang-reports',
    version: 1,
    // v0 기기 리포트는 지우지 않고 보낼 목록에 넣어 서버로 옮김
    migrate: (persisted): ReportState => {
      const legacy = ((persisted as { reports?: LegacyReport[] } | null)?.reports ?? []).flatMap(
        (item): PendingSave[] =>
          item.from && item.to
            ? [{ kind: 'CUSTOM', from: item.from, to: item.to, hospitalName: item.hospital }]
            : [],
      )
      return { reports: [], pending: legacy, ownerId: null }
    },
  }),
)

// 계정이 바뀌거나 목록을 다시 맞출 때마다 올림. 늦게 끝난 옛 작업이 새 상태를 덮지 않게
let syncCount = 0
// 로그인한 계정이 바뀔 때만 올림
let accountCount = 0

// 서버가 받지 않는 값이라 다시 보내도 안 되는 응답. 그 밖(연결 · 로그인 · 너무 많음 · 서버)은 다시
const DROP_STATUS = [400, 404, 409, 422]

// 예전 기기 리포트의 병원 이름을 지금 병원 번호로
function toRequest({ hospitalName, ...body }: PendingSave): VisitReportSave {
  if (body.kind !== 'CUSTOM' || body.careSiteId || !hospitalName) return body
  const found = useHospitalStore.getState().hospitals.find((h) => h.name === hospitalName)
  const id = Number(found?.id)
  return found && Number.isFinite(id) ? { ...body, careSiteId: id } : body
}

// 못 보낸 저장을 먼저 보내고 서버 목록으로 맞춤. 로그인 · 앱 열 때 · 목록 열 때 · 리포트를 남긴 뒤
export async function syncReports() {
  const mine = ++syncCount
  const sending = useReportStore.getState().pending
  const failed: PendingSave[] = []
  for (const item of sending) {
    // 그사이 계정이 바뀌었으면 앞 계정 저장을 새 계정으로 보내지 않음
    if (mine !== syncCount) return
    await saveVisitReport(toRequest(item)).catch((error: unknown) => {
      const status = isAxiosError(error) ? error.response?.status : undefined
      if (status === undefined || !DROP_STATUS.includes(status)) failed.push(item)
    })
  }
  if (mine !== syncCount) return
  // 보내는 사이 새로 쌓인 저장은 그대로 두고, 이번에 보낸 것만 정리
  useReportStore.setState((state) => ({
    pending: [...failed, ...state.pending.filter((item) => !sending.includes(item))],
  }))
  const reports = await getVisitReports()
  if (mine === syncCount) useReportStore.setState({ reports })
}

// 리포트를 서버에 남기고 목록을 다시 받음. 저장만 실패했을 때 보낼 목록에 두고 다음에 다시
export function keepVisitReport(body: VisitReportSave) {
  const account = accountCount
  saveVisitReport(body).then(
    () => syncReports().catch(() => {}),
    () => {
      // 그사이 계정이 바뀌었으면 새 계정 목록에 넣지 않음
      if (account === accountCount) {
        useReportStore.setState((state) => ({ pending: [...state.pending, body] }))
      }
    },
  )
}

// 로그인 직후 앞 계정 목록이 보이지 않게 비움. 보낼 목록은 계정을 확인한 뒤 startReports에서
export function clearReports() {
  syncCount += 1
  accountCount += 1
  useReportStore.setState({ reports: [] })
}

// 계정 확인 후 시작. 보낼 목록은 다른 계정 것일 때만 비움(주인 모르는 예전 리포트는 둠)
export function startReports(userId: number) {
  syncCount += 1
  accountCount += 1
  useReportStore.setState((state) => ({
    reports: [],
    pending: state.ownerId === null || state.ownerId === userId ? state.pending : [],
    ownerId: userId,
  }))
}
