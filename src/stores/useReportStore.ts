import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getVisitReports, type SavedReport } from '@/api/visitReports'

export type { SavedReport }

type ReportState = {
  reports: SavedReport[]
}

// 서버 지난 리포트를 기기에도 둠. 오프라인 · 화면 처음에 바로 보이게
export const useReportStore = create<ReportState>()(
  persist(() => ({ reports: [] as SavedReport[] }), {
    name: 'dangdang-reports',
    // v0은 기기에만 저장하던 리포트라 버리고 서버 목록으로
    version: 1,
    migrate: () => ({ reports: [] }),
  }),
)

// 서버 목록으로 맞춤. 다른 계정 리포트가 남지 않게 로그인 · 앱 열 때 · 목록 열 때
export async function syncReports() {
  useReportStore.setState({ reports: await getVisitReports() })
}
