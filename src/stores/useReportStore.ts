import { isAxiosError } from 'axios'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  getVisitReports,
  saveVisitReport,
  type SavedReport,
  type VisitReportSave,
} from '@/api/visitReports'

export type { SavedReport }

type ReportState = {
  reports: SavedReport[]
  // 못 보낸 리포트 저장. 다음 목록 맞출 때 다시 보냄
  pending: VisitReportSave[]
}

// v0 기기 저장 리포트. 서버엔 진료 일정 번호가 없어 기간 직접으로 올림
type LegacyReport = { from?: string; to?: string }

// 서버 지난 리포트를 기기에도 둠. 오프라인 · 화면 처음에 바로 보이게
export const useReportStore = create<ReportState>()(
  persist(() => ({ reports: [] as SavedReport[], pending: [] as VisitReportSave[] }), {
    name: 'dangdang-reports',
    version: 1,
    // v0 기기 리포트는 지우지 않고 보낼 목록에 넣어 서버로 옮김
    migrate: (persisted) => {
      const legacy = ((persisted as { reports?: LegacyReport[] } | null)?.reports ?? []).flatMap(
        (item): VisitReportSave[] =>
          item.from && item.to ? [{ kind: 'CUSTOM', from: item.from, to: item.to }] : [],
      )
      return { reports: [], pending: legacy }
    },
  }),
)

// 부를 때마다 올림. 늦게 온 옛 응답이 새 목록을 덮지 않게
let syncCount = 0

// 못 보낸 저장을 먼저 보내고 서버 목록으로 맞춤. 로그인 · 앱 열 때 · 목록 열 때 · 리포트를 남긴 뒤
export async function syncReports() {
  const mine = ++syncCount
  const failed: VisitReportSave[] = []
  for (const body of useReportStore.getState().pending) {
    await saveVisitReport(body).catch((error: unknown) => {
      // 서버가 받지 않는 값(4xx)은 다시 보내도 안 되니 버리고, 연결 · 서버 문제만 다시
      const status = isAxiosError(error) ? error.response?.status : undefined
      if (status === undefined || status >= 500) failed.push(body)
    })
  }
  useReportStore.setState({ pending: failed })
  const reports = await getVisitReports()
  if (mine === syncCount) useReportStore.setState({ reports })
}

// 리포트를 서버에 남기고 목록을 다시 받음. 못 남기면 보낼 목록에 두고 다음에 다시
export function keepVisitReport(body: VisitReportSave) {
  saveVisitReport(body)
    .then(() => syncReports())
    .catch(() => {
      useReportStore.setState((state) => ({ pending: [...state.pending, body] }))
    })
}

// 다른 계정 리포트가 보이지 않게 로그인할 때 먼저 비움
export function clearReports() {
  syncCount += 1
  useReportStore.setState({ reports: [], pending: [] })
}
