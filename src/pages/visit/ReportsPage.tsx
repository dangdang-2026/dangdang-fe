import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import iconChevronMd from '@/assets/icons/chevron-md.svg'
import iconReport from '@/assets/icons/report.svg'
import reportPreview from '@/assets/images/report/preview.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import FoodChip from '@/components/meal/FoodChip'
import ReportPeriodSheet from '@/components/report/ReportPeriodSheet'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useNow } from '@/hooks/useNow'
import { useHospitalStore } from '@/stores/useHospitalStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { syncReports, useReportStore, type SavedReport } from '@/stores/useReportStore'
import { formatMonthDay, parseDateKey, startOfDay, toDateKey } from '@/utils/date'
import { formatPregnancyRange } from '@/utils/pregnancy'

const formatShortDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`

// 리포트 줄 맨 위 상태 색: 기준 안 비율은 파랑, 직접 고른 기간은 진한 회색, 기준 받기 전은 회색
const STATUS_COLOR = {
  rate: 'text-blue-500',
  custom: 'text-grey-700',
  none: 'text-grey-600',
} as const

// Figma C-24 지난 진료 리포트. 볼 때마다 남긴 기록으로 다시 만듦
function ReportsPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.VISIT)
  const reports = useReportStore((state) => state.reports)
  const hospitals = useHospitalStore((state) => state.hospitals)
  const dueDate = useProfileStore((state) => state.dueDate)
  const [periodOpen, setPeriodOpen] = useState(false)
  // 병원 필터. null이면 전체
  const [hospitalFilter, setHospitalFilter] = useState<string | null>(null)
  const today = startOfDay(useNow())

  // 다니는 병원과 리포트에 남은 병원. 둘 이상일 때만 필터를 보여 줌
  const hospitalNames = [
    ...new Set([
      ...hospitals.map((item) => item.name),
      ...reports.map((item) => item.hospital).filter(Boolean),
    ]),
  ]
  // 서버가 최근 저장 순으로 줌
  const shown = reports.filter((saved) => !hospitalFilter || saved.hospital === hospitalFilter)

  // 서버 목록으로 맞춤. 못 받으면 기기에 남은 목록 그대로
  useEffect(() => {
    syncReports().catch(() => {})
  }, [])

  // 기간 직접은 custom, 진료용은 진료 일정으로 열어 서버가 정한 기간으로 보여 줌
  const openReport = (
    from: Date,
    to: Date,
    hospital: string,
    target: { custom: true } | { custom: false; visitId: string | null },
  ) => {
    const params = new URLSearchParams({ from: toDateKey(from), to: toDateKey(to), hospital })
    if (target.custom) params.set('custom', '1')
    else if (target.visitId) params.set('visitId', target.visitId)
    navigate(`${ROUTES.VISIT_REPORT}?${params}`)
  }

  // 상태: 직접 고른 기간 > 기록 없음 > 기준 받기 전 > 목표 안 비율(서버가 기록마다 그때 기준으로 계산)
  const summarize = (saved: SavedReport) => {
    const from = parseDateKey(saved.from) ?? today
    const to = parseDateKey(saved.to) ?? today
    const status = saved.custom
      ? { text: '직접 고른 기간', tone: 'custom' as const }
      : saved.measured === 0
        ? { text: '기록 없음', tone: 'none' as const }
        : saved.inTargetRate === null
          ? { text: '기준 받기 전', tone: 'none' as const }
          : {
              text: `내 기준 안 ${Math.round(saved.inTargetRate * 100)}%`,
              tone: 'rate' as const,
            }
    const visitDate = parseDateKey(saved.visitDate)
    const detail = [
      saved.hospital,
      visitDate
        ? `${formatShortDate(visitDate)} 진료`
        : `${formatShortDate(new Date(saved.createdAt))} 만듦`,
      // 직접 고른 기간은 피그마처럼 만든 날까지만
      saved.custom ? null : formatPregnancyRange(dueDate, from, to),
    ]
      .filter(Boolean)
      .join(' · ')
    return { from, to, status, measured: saved.measured, detail }
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-10">
      <SubPageHeader title="지난 진료 리포트" onBack={goBack} />

      <div className="mt-3 flex flex-col gap-4">
        {hospitalNames.length > 1 && (
          <div role="group" aria-label="병원 필터" className="flex flex-wrap gap-2">
            <FoodChip
              name="전체"
              selected={hospitalFilter === null}
              onClick={() => setHospitalFilter(null)}
            />
            {hospitalNames.map((name) => (
              <FoodChip
                key={name}
                name={name}
                selected={hospitalFilter === name}
                onClick={() => setHospitalFilter(name)}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          className="flex items-center gap-3 rounded-2xl bg-yellow-50 p-4 text-left"
          onClick={() => setPeriodOpen(true)}
        >
          <img src={iconReport} alt="" width={22} height={22} />
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-t6 text-grey-900 font-bold">기간 골라 리포트 만들기</span>
            <span className="text-t7 text-grey-700">지난 2주 · 이번 달 · 임신 중 전체</span>
          </span>
          <img src={iconChevronMd} alt="" width={16} height={16} />
        </button>

        <section className="flex flex-col gap-7">
          <h2 className="text-grey-900 text-lg leading-snug font-bold">지난 리포트</h2>
          {shown.length === 0 ? (
            <p className="text-grey-500 border-grey-200 rounded-2xl border px-4.5 py-6 text-center text-sm leading-normal">
              {reports.length > 0
                ? '이 병원 리포트는 아직 없어요'
                : '리포트를 저장하거나 공유하면 여기에 남아요'}
            </p>
          ) : (
            <ul className="flex flex-col gap-7">
              {shown.map((saved) => {
                const { from, to, status, measured, detail } = summarize(saved)
                return (
                  <li key={saved.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-4 text-left"
                      onClick={() =>
                        openReport(
                          from,
                          to,
                          saved.hospital,
                          saved.custom
                            ? { custom: true }
                            : { custom: false, visitId: saved.visitId },
                        )
                      }
                    >
                      <span className="flex min-w-0 flex-1 flex-col gap-1 leading-snug">
                        <span className="flex gap-2 text-sm leading-snug font-bold">
                          <span className={STATUS_COLOR[status.tone]}>{status.text}</span>
                          <span className="text-grey-600">측정 {measured}번</span>
                        </span>
                        <span className="text-subtitle-1 text-grey-900 leading-snug font-medium">
                          {formatMonthDay(from)} – {formatMonthDay(to)} 리포트
                        </span>
                        <span className="text-t7 text-grey-600 leading-snug">{detail}</span>
                      </span>
                      <img src={reportPreview} alt="" width={72} height={90} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="text-grey-600 text-xs leading-snug">
            리포트는 열 때마다 남긴 기록으로 다시 만들어요. 기준은 그 기간의 병원 기준 그대로예요.
          </p>
        </section>
      </div>

      {periodOpen && (
        <ReportPeriodSheet
          today={today}
          onCreate={({ from, to }, hospital) => openReport(from, to, hospital, { custom: true })}
          onClose={() => setPeriodOpen(false)}
        />
      )}
    </main>
  )
}

export default ReportsPage
