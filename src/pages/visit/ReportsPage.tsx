import { useState } from 'react'
import { useNavigate } from 'react-router'
import iconChevronMd from '@/assets/icons/chevron-md.svg'
import iconInfo from '@/assets/icons/info-lg.svg'
import iconReport from '@/assets/icons/report.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import ReportPeriodSheet from '@/components/report/ReportPeriodSheet'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useNow } from '@/hooks/useNow'
import { useCriteriaStore } from '@/stores/useCriteriaStore'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { useReportStore, type SavedReport } from '@/stores/useReportStore'
import { formatMonthDay, parseDateKey, startOfDay, toDateKey } from '@/utils/date'
import { buildReport } from '@/utils/report'

const formatShortDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`

// Figma C-24 지난 진료 리포트. 볼 때마다 남긴 기록으로 다시 만듦
function ReportsPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.VISIT)
  const reports = useReportStore((state) => state.reports)
  const records = useGlucoseStore((state) => state.records)
  const meals = useGlucoseStore((state) => state.meals)
  const versions = useCriteriaStore((state) => state.versions)
  const [periodOpen, setPeriodOpen] = useState(false)
  const today = startOfDay(useNow())

  const openReport = (from: Date, to: Date) => {
    navigate(`${ROUTES.VISIT_REPORT}?from=${toDateKey(from)}&to=${toDateKey(to)}`)
  }

  // 측정 수와 목표 밖 합계. 목표가 하나도 없으면 비교 안 함
  const summarize = (saved: SavedReport) => {
    const from = parseDateKey(saved.from) ?? today
    const to = parseDateKey(saved.to) ?? today
    const report = buildReport({ records, meals, from, to, versions })
    const compared = report.slots.filter((slot) => slot.outOfTarget !== null)
    const outOfTarget = compared.reduce((sum, slot) => sum + (slot.outOfTarget ?? 0), 0)
    return {
      from,
      to,
      text: `측정 ${report.measured} · ${
        compared.length ? `목표 밖 ${outOfTarget}` : '목표 없음(비교 안 함)'
      }`,
    }
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-10">
      <SubPageHeader title="지난 진료 리포트" onBack={goBack} />

      <div className="mt-3 flex flex-col gap-4">
        <button
          type="button"
          className="flex items-center gap-3 rounded-2xl bg-yellow-50 p-4 text-left"
          onClick={() => setPeriodOpen(true)}
        >
          <img src={iconReport} alt="" width={22} height={22} />
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-t6 text-grey-900 font-bold">기간 골라 리포트 만들기</span>
            <span className="text-t7 text-grey-600">지난 2주 · 이번 달 · 전체 기록</span>
          </span>
          <img src={iconChevronMd} alt="" width={16} height={16} />
        </button>

        <p className="text-t7 text-grey-500 font-medium">진료마다 만든 리포트 {reports.length}장</p>

        {reports.length === 0 ? (
          <p className="text-grey-500 border-grey-200 rounded-2xl border px-4.5 py-6 text-center text-sm leading-normal">
            리포트를 저장하거나 공유하면 여기에 남아요
          </p>
        ) : (
          <ul className="border-grey-200 overflow-hidden rounded-2xl border">
            {[...reports].reverse().map((saved, index) => {
              const { from, to, text } = summarize(saved)
              const visitAt = saved.visitAt ? new Date(saved.visitAt) : null
              return (
                <li key={saved.id} className={index > 0 ? 'border-grey-100 border-t' : ''}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 py-4 pr-4 pl-4.5 text-left"
                    onClick={() => openReport(from, to)}
                  >
                    <span className="flex flex-1 flex-col gap-1">
                      <span className="text-grey-900 text-base leading-normal font-bold">
                        {formatMonthDay(from)} – {formatMonthDay(to)}
                      </span>
                      <span className="text-t7 text-grey-600">
                        {saved.hospital}
                        {visitAt && ` · ${formatShortDate(visitAt)} 진료`}
                      </span>
                      <span className="text-t7 text-grey-800 font-medium">{text}</span>
                    </span>
                    <img src={iconChevronMd} alt="" width={16} height={16} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <p className="bg-grey-50 flex gap-2 rounded-xl px-3.5 py-3">
          <img src={iconInfo} alt="" width={18} height={18} className="self-start" />
          <span className="text-grey-700 text-t7 flex-1 leading-relaxed">
            리포트는 볼 때마다 남긴 기록으로 다시 만들어요. 기준은 그 진료 기간의 병원 기준
            그대로예요.
          </span>
        </p>
      </div>

      {periodOpen && (
        <ReportPeriodSheet
          today={today}
          onCreate={openReport}
          onClose={() => setPeriodOpen(false)}
        />
      )}
    </main>
  )
}

export default ReportsPage
