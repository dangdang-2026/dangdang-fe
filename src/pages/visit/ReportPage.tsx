import { useCallback, useEffect, useRef, useState } from 'react'
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
import { useReportContent } from '@/hooks/useReportContent'
import { getVisitReportPeriod, saveVisitReport, type VisitReportSave } from '@/api/visitReports'
import { useHospitalStore } from '@/stores/useHospitalStore'
import { syncReports } from '@/stores/useReportStore'
import { useVisitStore } from '@/stores/useVisitStore'
import { addDays, parseDateKey, startOfDay, toDateKey } from '@/utils/date'
import { formatReportText } from '@/utils/report'
import { createReportImage, saveReportImage } from '@/utils/reportImage'

// 화면이 그려진 뒤 사진을 미리 만들기까지 기다리는 시간
const PHOTO_DELAY_MS = 500

// Figma C-06 진료 리포트. 최근 2주 기록을 A4 1쪽으로
function ReportPage() {
  const goBack = useGoBack(ROUTES.VISIT)
  const questions = useVisitStore((state) => state.questions)
  const [shareOpen, setShareOpen] = useState(false)
  // 병원 밖으로 보낼 때 이름 빼기
  const [hideName, setHideName] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  // 사진으로 저장할 리포트 카드
  const receiptRef = useRef<HTMLDivElement>(null)
  const [savingPhoto, setSavingPhoto] = useState(false)

  const currentVisitId = useVisitStore((state) => state.visitId)
  const hospitals = useHospitalStore((state) => state.hospitals)
  const [searchParams] = useSearchParams()

  const now = useNow()
  const today = startOfDay(now)
  // ?hospital= 보여 줄 병원, ?custom=1 기간을 직접 골라 만든 리포트, ?visitId= 진료용 리포트의 진료 일정
  // ?reportId= 지난 리포트를 다시 엶. 이미 서버에 있어 다시 전해도 새로 남기지 않음
  const custom = searchParams.get('custom') === '1'
  const reopened = searchParams.has('reportId')
  // 진료용 리포트: 기간을 안 줬으면 지금 진료 일정, 다시 열면 그 리포트의 진료 일정
  const reportVisitId = custom
    ? null
    : (searchParams.get('visitId') ?? (searchParams.has('from') ? null : currentVisitId))
  // 진료용은 서버가 정한 기간(지난 진료일 ~ 진료 전날)으로 보여 줘야 저장 · 목록 숫자와 같음
  const [visitPeriod, setVisitPeriod] = useState<
    { visitId: string; from: Date; to: Date } | { visitId: string; failed: true } | null
  >(null)
  useEffect(() => {
    if (!reportVisitId) return
    let canceled = false
    getVisitReportPeriod(reportVisitId)
      .then((period) => {
        if (!canceled) setVisitPeriod({ visitId: reportVisitId, ...period })
      })
      // 진료 날짜 미정 · 오프라인이면 아래 기본 기간으로, 저장은 기간 직접으로
      .catch(() => {
        if (!canceled) setVisitPeriod({ visitId: reportVisitId, failed: true })
      })
    return () => {
      canceled = true
    }
  }, [reportVisitId])
  const periodForVisit = visitPeriod?.visitId === reportVisitId ? visitPeriod : null
  const servedPeriod = periodForVisit && 'from' in periodForVisit ? periodForVisit : null
  // 기간을 받는 중이어도 진료용으로 남김(기간은 서버가 정함). 못 받았을 때만 기간 직접
  const saveAsVisit = !!reportVisitId && !(periodForVisit && 'failed' in periodForVisit)
  // ?from=&to= 로 기간 지정(지난 리포트·기간 고르기). 없으면 최근 2주
  const to = servedPeriod?.to ?? parseDateKey(searchParams.get('to')) ?? today
  const from =
    servedPeriod?.from ?? parseDateKey(searchParams.get('from')) ?? addDays(to, -(REPORT_DAYS - 1))
  const { report, title, periodLabel, criteriaLines, hospital } = useReportContent({
    from,
    to,
    hideName,
    hospitalName: searchParams.get('hospital') ?? undefined,
  })

  // 인쇄 창이 닫히면 PDF 저장 안내
  useEffect(() => {
    const handleAfterPrint = () => setToast('PDF로 저장했다면 파일 앱에서 볼 수 있어요')
    window.addEventListener('afterprint', handleAfterPrint)
    return () => window.removeEventListener('afterprint', handleAfterPrint)
  }, [])

  // 서버 없이 브라우저 인쇄로 A4 리포트를 만듦(인쇄 창에서 PDF로 저장 선택)
  // 리포트를 전하면 지난 리포트에 남김
  const keepReport = () => {
    if (reopened) return
    // 서버에 남김. 진료 일정이 있으면 진료용, 아니면 지금 보이는 기간 그대로 기간 직접
    const careSiteId = Number(hospitals.find((item) => item.name === hospital.name)?.id)
    const body: VisitReportSave =
      saveAsVisit && reportVisitId
        ? { kind: 'VISIT', visitId: Number(reportVisitId) }
        : {
            kind: 'CUSTOM',
            from: toDateKey(from),
            to: toDateKey(to),
            careSiteId: Number.isFinite(careSiteId) ? careSiteId : undefined,
          }
    // 남긴 뒤 지난 리포트 목록을 다시 받음. 못 남겨도 리포트 전하기는 그대로
    saveVisitReport(body)
      .then(() => syncReports())
      .catch(() => {})
  }

  const printReport = () => {
    keepReport()
    setShareOpen(false)
    // 시트가 닫힌 뒤 인쇄 창 열기
    window.setTimeout(() => window.print(), 0)
  }

  // 누르는 순간 공유 창을 띄워야 해서 리포트 사진을 미리 만들어 둠. 내용이 바뀌면 다시
  const photo = useRef<{ key: string; blob: Blob } | null>(null)
  // 리포트 카드에 그리는 값 전부. 기준 · 병원이 늦게 들어와도 옛 사진을 쓰지 않게
  const photoKey = JSON.stringify({
    hideName,
    title,
    periodLabel,
    criteriaLines,
    measured: report.measured,
    blanks: report.blanks,
    lateEntries: report.lateEntries,
    slots: report.slots.map(({ label, outOfTarget, total }) => [label, outOfTarget, total]),
    lows: report.lows.length,
    questions: questions.length,
  })
  useEffect(() => {
    let canceled = false
    const timer = window.setTimeout(() => {
      const node = receiptRef.current
      if (!node) return
      createReportImage(node)
        .then((blob) => {
          if (!canceled) photo.current = { key: photoKey, blob }
        })
        .catch(() => {})
    }, PHOTO_DELAY_MS)
    return () => {
      canceled = true
      window.clearTimeout(timer)
    }
  }, [photoKey])

  // 사진으로 저장: 휴대폰은 공유 창에서 이미지 저장, 컴퓨터는 파일 내려받기
  const savePhoto = async () => {
    setShareOpen(false)
    const node = receiptRef.current
    if (!node || savingPhoto) return
    setSavingPhoto(true)
    try {
      // 미리 만든 게 없거나 낡았으면 지금 만듦(이때는 아이폰이 공유 창을 막으면 내려받기로)
      const blob =
        photo.current?.key === photoKey ? photo.current.blob : await createReportImage(node)
      const result = await saveReportImage(
        blob,
        `당당-혈당기록-${toDateKey(from)}-${toDateKey(to)}.png`,
      )
      if (result === 'canceled') return
      keepReport()
      // 공유 창에서는 저장 대신 다른 앱으로 보낼 수도 있어 둘 다 맞는 말로
      setToast(
        result === 'shared'
          ? '사진을 저장하거나 보냈어요'
          : '사진으로 저장했어요 · 다운로드 폴더에서 볼 수 있어요',
      )
    } catch {
      setToast('사진으로 저장하지 못했어요. 잠시 후 다시 시도해 주세요')
    } finally {
      setSavingPhoto(false)
    }
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

        <div ref={receiptRef} className="relative mt-3">
          <ReportReceipt
            report={report}
            periodLabel={periodLabel}
            title={title}
            criteriaLines={criteriaLines}
            questionCount={questions.length}
          />
        </div>

        <div className="fixed bottom-[max(--spacing(10),env(safe-area-inset-bottom))] left-1/2 w-full max-w-107.5 -translate-x-1/2 px-5">
          <SlideToSave
            label={savingPhoto ? '사진 만드는 중이에요' : '밀어서 사진으로 저장'}
            onComplete={() => void savePhoto()}
          />
        </div>

        {shareOpen && (
          <ReportShareSheet
            hideName={hideName}
            onToggleHideName={() => setHideName((prev) => !prev)}
            onSavePhoto={() => void savePhoto()}
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
