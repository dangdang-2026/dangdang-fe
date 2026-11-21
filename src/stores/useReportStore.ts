import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 저장·인쇄·공유한 리포트. 내용은 볼 때마다 기록으로 다시 만듦
export type SavedReport = {
  id: string
  // YYYY-MM-DD
  from: string
  to: string
  hospital: string
  // 이 리포트로 본 진료 일시. 기간을 직접 골라 만들었거나 진료일을 모르면 없음
  visitAt?: string
  // 기간 골라 만들기(C-25)로 만든 리포트
  custom?: boolean
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
      // 같은 기간 · 병원 · 종류를 다시 전하면 최신으로 갱신
      saveReport: (report, now = new Date()) =>
        set((state) => ({
          reports: [
            ...state.reports.filter(
              (item) =>
                item.from !== report.from ||
                item.to !== report.to ||
                item.hospital !== report.hospital ||
                !!item.custom !== !!report.custom,
            ),
            { ...report, id: crypto.randomUUID(), createdAt: now.toISOString() },
          ],
        })),
    }),
    { name: 'dangdang-reports' },
  ),
)
