import { useState } from 'react'
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
import { useCriteriaStore } from '@/stores/useCriteriaStore'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { useHospitalStore } from '@/stores/useHospitalStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { useReportStore, type SavedReport } from '@/stores/useReportStore'
import { formatMonthDay, parseDateKey, startOfDay, toDateKey } from '@/utils/date'
import { formatPregnancyRange } from '@/utils/pregnancy'
import { buildReport } from '@/utils/report'

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
  const records = useGlucoseStore((state) => state.records)
  const meals = useGlucoseStore((state) => state.meals)
  const versions = useCriteriaStore((state) => state.versions)
  const hospitals = useHospitalStore((state) => state.hospitals)
  const dueDate = useProfileStore((state) => state.dueDate)
  const [periodOpen, setPeriodOpen] = useState(false)
  // 병원 필터. null이면 전체
  const [hospitalFilter, setHospitalFilter] = useState<string | null>(null)
  const today = startOfDay(useNow())

  // 다니는 병원과 리포트에 남은 병원. 둘 이상일 때만 필터를 보여 줌
  const hospitalNames = [
    ...new Set([...hospitals.map((item) => item.name), ...reports.map((item) => item.hospital)]),
  ]
  const shown = [...reports]
    .reverse()
    .filter((saved) => !hospitalFilter || saved.hospital === hospitalFilter)

  // 기간을 직접 골라 만든 리포트는 진료일 없이 남기려고 custom을 붙임
  const openReport = (from: Date, to: Date, hospital: string, custom: boolean) => {
    const params = new URLSearchParams({ from: toDateKey(from), to: toDateKey(to), hospital })
    if (custom) params.set('custom', '1')
    navigate(`${ROUTES.VISIT_REPORT}?${params}`)
  }

  // 상태: 진료 리포트는 기준 안 비율(목표가 없던 기간이면 기준 받기 전), 직접 고른 기간은 그대로
  const summarize = (saved: SavedReport) => {
    const from = parseDateKey(saved.from) ?? today
    const to = parseDateKey(saved.to) ?? today
    const report = buildReport({ records, meals, from, to, versions })
    const compared = report.slots.filter((slot) => slot.outOfTarget !== null)
    const total = compared.reduce((sum, slot) => sum + slot.total, 0)
    const outOfTarget = compared.reduce((sum, slot) => sum + (slot.outOfTarget ?? 0), 0)
    const status = !saved.visitAt
      ? { text: '직접 고른 기간', tone: 'custom' as const }
      : total === 0
        ? { text: '기준 받기 전', tone: 'none' as const }
        : {
            text: `내 기준 안 ${Math.round(((total - outOfTarget) / total) * 100)}%`,
            tone: 'rate' as const,
          }
    const visitAt = saved.visitAt ? new Date(saved.visitAt) : null
    const pregnancy = formatPregnancyRange(dueDate, from, to)
    const detail = [
      saved.hospital,
      visitAt
        ? `${formatShortDate(visitAt)} 진료`
        : `${formatShortDate(new Date(saved.createdAt))} 만듦`,
      // 직접 고른 기간은 피그마처럼 만든 날까지만
      visitAt ? pregnancy : null,
    ]
      .filter(Boolean)
      .join(' · ')
    return { from, to, status, measured: report.measured, detail }
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
              리포트를 저장하거나 공유하면 여기에 남아요
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
                      onClick={() => openReport(from, to, saved.hospital, !saved.visitAt)}
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
          onCreate={({ from, to }, hospital) => openReport(from, to, hospital, true)}
          onClose={() => setPeriodOpen(false)}
        />
      )}
    </main>
  )
}

export default ReportsPage
