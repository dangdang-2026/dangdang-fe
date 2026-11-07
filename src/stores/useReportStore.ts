import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 저장·인쇄·공유한 리포트. 내용은 볼 때마다 기록으로 다시 만듦
export type SavedReport = {
  id: string
  // YYYY-MM-DD
  from: string
  to: string
  hospital: string
  // 이 리포트로 본 진료 일시. 모르면 없음
  visitAt?: string
  createdAt: string
}

type ReportState = {
  reports: SavedReport[]
  saveReport: (report: Omit<SavedReport, 'id' | 'createdAt'>, now?: Date) => void
}

// API 연동 전까지 기기(localStorage)에 저장
export const useReportStore = create<ReportState>()(
  persist(
    (set) => ({
      reports: [],
      // 같은 기간을 다시 전하면 최신으로 갱신
      saveReport: (report, now = new Date()) =>
        set((state) => ({
          reports: [
            ...state.reports.filter((item) => item.from !== report.from || item.to !== report.to),
            { ...report, id: crypto.randomUUID(), createdAt: now.toISOString() },
          ],
        })),
    }),
    { name: 'dangdang-reports' },
  ),
)
