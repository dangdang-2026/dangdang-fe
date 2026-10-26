import { useNavigate } from 'react-router'
import iconBack from '@/assets/icons/back.svg'
import ReportReceipt from '@/components/report/ReportReceipt'
import { REPORT_DAYS } from '@/constants/report'
import { ROUTES } from '@/constants/routes'
import { useNow } from '@/hooks/useNow'
import { MOCK_HOSPITAL } from '@/mocks/hospital'
import { MOCK_USER } from '@/mocks/user'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { useVisitStore } from '@/stores/useVisitStore'
import { addDays, formatMonthDay, startOfDay } from '@/utils/date'
import { buildReport, formatCriteria } from '@/utils/report'

// Figma C-06 진료 리포트. 최근 2주 기록을 A4 1쪽으로
function ReportPage() {
  const navigate = useNavigate()
  const records = useGlucoseStore((state) => state.records)
  const meals = useGlucoseStore((state) => state.meals)
  const questions = useVisitStore((state) => state.questions)

  const today = startOfDay(useNow())
  const from = addDays(today, -(REPORT_DAYS - 1))
  const report = buildReport({
    records,
    meals,
    from,
    to: today,
    targets: MOCK_USER.targets,
    postMealHours: MOCK_USER.postMealHours,
  })

  const periodLabel = `${formatMonthDay(from)} – ${formatMonthDay(today)}`
  const criteria = formatCriteria(MOCK_USER.targets, MOCK_USER.postMealHours)
  const criteriaLines = [
    criteria ? `기준: ${criteria}` : '기준: 적은 목표가 없어 비교하지 않았어요',
    `${MOCK_HOSPITAL.name} 안내 · 본인 입력`,
  ]

  return (
    <main className="bg-grey-100 relative mx-auto min-h-dvh w-full max-w-107.5 px-5 pt-13 pb-30">
      {/* 위쪽 노란 띠 */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-62.5 bg-linear-to-b from-yellow-400 to-yellow-500"
      />

      <header className="relative flex h-14 items-center justify-between">
        <button type="button" aria-label="뒤로" onClick={() => navigate(ROUTES.VISIT)}>
          <img src={iconBack} alt="" width={24} height={24} />
        </button>
        <h1 className="text-subtitle-1 text-grey-900 absolute left-1/2 -translate-x-1/2">
          진료 리포트
        </h1>
        <span className="size-10" />
      </header>

      <div className="relative mt-3">
        <ReportReceipt
          report={report}
          periodLabel={periodLabel}
          title={`${MOCK_USER.name} 님 혈당 기록`}
          criteriaLines={criteriaLines}
          questionCount={questions.length}
        />
      </div>
    </main>
  )
}

export default ReportPage
