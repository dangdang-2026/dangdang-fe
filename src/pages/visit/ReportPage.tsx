import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import iconBack from '@/assets/icons/back.svg'
import iconShare from '@/assets/icons/share.svg'
import Toast from '@/components/common/Toast'
import ReportDocument from '@/components/report/ReportDocument'
import ReportReceipt from '@/components/report/ReportReceipt'
import ReportShareSheet from '@/components/report/ReportShareSheet'
import SlideToSave from '@/components/report/SlideToSave'
import { REPORT_DAYS } from '@/constants/report'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useNow } from '@/hooks/useNow'
import { MOCK_HOSPITAL } from '@/mocks/hospital'
import { useProfileStore } from '@/stores/useProfileStore'
import { formatPregnancyRange } from '@/utils/pregnancy'
import { useCriteriaStore } from '@/stores/useCriteriaStore'
import { getCriteriaAt } from '@/utils/criteria'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { useReportStore } from '@/stores/useReportStore'
import { useVisitStore } from '@/stores/useVisitStore'
import { addDays, formatMonthDay, parseDateKey, startOfDay, toDateKey } from '@/utils/date'
import { buildReport, formatCriteria, formatReportText } from '@/utils/report'

// Figma C-06 진료 리포트. 최근 2주 기록을 A4 1쪽으로
function ReportPage() {
  const goBack = useGoBack(ROUTES.VISIT)
  const records = useGlucoseStore((state) => state.records)
  const meals = useGlucoseStore((state) => state.meals)
  const questions = useVisitStore((state) => state.questions)
  const [shareOpen, setShareOpen] = useState(false)
  // 병원 밖으로 보낼 때 이름 빼기
  const [hideName, setHideName] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const versions = useCriteriaStore((state) => state.versions)

  const nextVisitAt = useVisitStore((state) => state.nextVisitAt)
  const saveReport = useReportStore((state) => state.saveReport)
  const [searchParams] = useSearchParams()
  const name = useProfileStore((state) => state.name)
  const dueDate = useProfileStore((state) => state.dueDate)

  const now = useNow()
  const today = startOfDay(now)
  // ?from=&to= 로 기간 지정(지난 리포트·기간 고르기). 없으면 최근 2주
  const to = parseDateKey(searchParams.get('to')) ?? today
  const from = parseDateKey(searchParams.get('from')) ?? addDays(to, -(REPORT_DAYS - 1))
  const report = buildReport({ records, meals, from, to, versions })

  const pregnancy = formatPregnancyRange(dueDate, from, to)
  const periodLabel = `${formatMonthDay(from)} – ${formatMonthDay(to)}${pregnancy ? ` · ${pregnancy}` : ''}`
  const title = hideName ? '혈당 기록' : `${name} 님 혈당 기록`
  // 기준 줄은 리포트 마지막 날 기준
  const { targets, postMealHours } = getCriteriaAt(versions, to)
  const criteria = formatCriteria(targets, postMealHours)
  const criteriaLines = [
    criteria ? `기준: ${criteria}` : '기준: 적은 목표가 없어 비교하지 않았어요',
    `${MOCK_HOSPITAL.name} 안내 · 본인 입력`,
  ]

  // 인쇄 창이 닫히면 PDF 저장 안내
  useEffect(() => {
    const handleAfterPrint = () => setToast('PDF로 저장했다면 파일 앱에서 볼 수 있어요')
    window.addEventListener('afterprint', handleAfterPrint)
    return () => window.removeEventListener('afterprint', handleAfterPrint)
  }, [])

  // 서버 없이 브라우저 인쇄로 A4 리포트를 만듦(인쇄 창에서 PDF로 저장 선택)
  // 리포트를 전하면 지난 리포트에 남김
  const keepReport = () => {
    saveReport({
      from: toDateKey(from),
      to: toDateKey(to),
      hospital: MOCK_HOSPITAL.name,
      visitAt: nextVisitAt ?? undefined,
    })
  }

  const printReport = () => {
    keepReport()
    setShareOpen(false)
    // 시트가 닫힌 뒤 인쇄 창 열기
    window.setTimeout(() => window.print(), 0)
  }

  const shareReport = async () => {
    const text = formatReportText({ report, title, periodLabel, criteriaLines, questions })
    keepReport()
    setShareOpen(false)
    try {
      if (navigator.share) {
        await navigator.share({ title: '진료 리포트', text })
        return
      }
      await navigator.clipboard.writeText(text)
      setToast('리포트 내용을 복사했어요')
    } catch {
      // 공유 창을 닫은 경우는 그대로 둠
    }
  }

  const closeShare = useCallback(() => setShareOpen(false), [])
  const closeToast = useCallback(() => setToast(null), [])

  return (
    <>
      <main className="bg-grey-100 relative mx-auto min-h-dvh w-full max-w-107.5 px-5 pt-13 pb-30 print:hidden">
        {/* 위쪽 노란 띠 */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-62.5 bg-linear-to-b from-yellow-400 to-yellow-500"
        />

        <header className="relative flex h-14 items-center justify-between">
          <button type="button" aria-label="뒤로" onClick={goBack}>
            <img src={iconBack} alt="" width={24} height={24} />
          </button>
          <h1 className="text-subtitle-1 text-grey-900 absolute left-1/2 -translate-x-1/2">
            진료 리포트
          </h1>
          <button
            type="button"
            aria-label="리포트 전하기"
            className="rounded-full bg-white p-2.5"
            onClick={() => setShareOpen(true)}
          >
            <img src={iconShare} alt="" width={20} height={20} />
          </button>
        </header>

        <div className="relative mt-3">
          <ReportReceipt
            report={report}
            periodLabel={periodLabel}
            title={title}
            criteriaLines={criteriaLines}
            questionCount={questions.length}
          />
        </div>

        <div className="fixed bottom-[max(--spacing(10),env(safe-area-inset-bottom))] left-1/2 w-full max-w-107.5 -translate-x-1/2 px-5">
          <SlideToSave label="밀어서 PDF로 저장" onComplete={printReport} />
        </div>

        {shareOpen && (
          <ReportShareSheet
            hideName={hideName}
            onToggleHideName={() => setHideName((prev) => !prev)}
            onSavePdf={printReport}
            onPrint={printReport}
            onShare={shareReport}
            onClose={closeShare}
          />
        )}
        {toast && <Toast message={toast} onClose={closeToast} />}
      </main>

      {/* 인쇄할 때만 보이는 A4 리포트 */}
      <div className="hidden print:block">
        <ReportDocument
          report={report}
          periodLabel={periodLabel}
          title={title}
          criteriaLines={criteriaLines}
          questions={questions}
          createdAt={now}
        />
      </div>
    </>
  )
}

export default ReportPage
