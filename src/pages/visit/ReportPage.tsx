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
import { useRangeSync } from '@/hooks/useRangeSync'
import { useReportContent } from '@/hooks/useReportContent'
import { getErrorCode } from '@/api/axios'
import {
  getSavedReportMissed,
  getVisitReportPeriod,
  type VisitReportSave,
} from '@/api/visitReports'
import { useHospitalStore } from '@/stores/useHospitalStore'
import { keepVisitReport } from '@/stores/useReportStore'
import { useVisitSaveStore, useVisitStore } from '@/stores/useVisitStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { addDays, parseDateKey, startOfDay, toDateKey } from '@/utils/date'
import { formatReportText, type ReportMissed } from '@/utils/report'
import {
  createReportImage,
  getReportFileName,
  saveReportImage,
  shareReportImage,
} from '@/utils/reportImage'

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
  // 파일 공유가 막혔을 때 토스트에서 다시 눌러 글로 보내기
  const [toastAction, setToastAction] = useState<{ label: string; onClick: () => void } | null>(
    null,
  )
  // 사진으로 저장할 리포트 카드
  const receiptRef = useRef<HTMLDivElement>(null)
  const [savingPhoto, setSavingPhoto] = useState(false)

  const currentVisitId = useVisitStore((state) => state.visitId)
  const nextVisitAt = useVisitStore((state) => state.nextVisitAt)
  const hospitals = useHospitalStore((state) => state.hospitals)
  const [searchParams] = useSearchParams()

  const now = useNow()
  const today = startOfDay(now)
  // ?hospital= 보여 줄 병원, ?custom=1 기간을 직접 골라 만든 리포트, ?visitId= 진료용 리포트의 진료 일정
  // ?reportId= 지난 리포트를 다시 엶. 이미 서버에 있어 다시 전해도 새로 남기지 않음
  const custom = searchParams.get('custom') === '1'
  const reopened = searchParams.has('reportId')
  // 지금 진료 일정이 오늘 이후일 때만 이번 진료용. 지난 진료면 최근 2주 기간 직접으로
  const upcoming = !!nextVisitAt && startOfDay(new Date(nextVisitAt)) >= today
  // 진료용 리포트: 다시 열면 그 리포트의 진료 일정, 기간을 안 줬으면 다가오는 진료 일정
  const reportVisitId = custom
    ? null
    : (searchParams.get('visitId') ??
      (searchParams.has('from') || !upcoming ? null : currentVisitId))
  // 진료용은 서버가 정한 기간(지난 진료일 ~ 진료 전날)으로 보여 줘야 저장 · 목록 숫자와 같음
  // 진료일 저장 중엔 받지 않고, 저장이 끝날 때마다(version) 다시 받음. 같은 visitId로 날짜만 바꿔도 맞게
  const visitSaving = useVisitSaveStore((state) => state.saving > 0)
  const visitVersion = useVisitSaveStore((state) => state.version)
  const periodKey = reportVisitId && !visitSaving ? `${reportVisitId}|${visitVersion}` : null
  // 기간을 못 받으면 몇 번째 시도에서 실패했는지 남겨 다시 받을 때 구분
  const [periodTry, setPeriodTry] = useState(0)
  const [visitPeriod, setVisitPeriod] = useState<
    | {
        key: string
        from: Date
        to: Date
        careSiteName: string | null
        careSiteId: string | null
        missed: ReportMissed | null
      }
    | { key: string; undecided: true }
    | { key: string; failedTry: number }
    | null
  >(null)
  useEffect(() => {
    if (!periodKey || !reportVisitId) return
    let canceled = false
    getVisitReportPeriod(reportVisitId)
      .then((period) => {
        if (!canceled) setVisitPeriod({ key: periodKey, ...period })
      })
      .catch((error: unknown) => {
        if (canceled) return
        // 진료 날짜 미정이면 아래 기본 기간으로, 저장은 기간 직접으로. 그 밖(오프라인 등)은 전하기를 막고 다시 받음
        setVisitPeriod(
          getErrorCode(error) === 'VISIT_40003'
            ? { key: periodKey, undecided: true }
            : { key: periodKey, failedTry: periodTry },
        )
      })
    return () => {
      canceled = true
    }
  }, [periodKey, reportVisitId, periodTry])
  const periodForVisit = periodKey && visitPeriod?.key === periodKey ? visitPeriod : null
  const servedPeriod = periodForVisit && 'from' in periodForVisit ? periodForVisit : null
  const periodFailed =
    !!periodForVisit && 'failedTry' in periodForVisit && periodForVisit.failedTry === periodTry
  // 기간을 받는 동안 · 못 받았을 때는 화면 기간과 서버 기간이 다를 수 있어 전하기를 막음
  const periodPending =
    !!reportVisitId && (!periodForVisit || ('failedTry' in periodForVisit && !periodFailed))
  // ?from=&to= 로 기간 지정(지난 리포트·기간 고르기). 없으면 최근 2주
  const to = servedPeriod?.to ?? parseDateKey(searchParams.get('to')) ?? today
  const from =
    servedPeriod?.from ?? parseDateKey(searchParams.get('from')) ?? addDays(to, -(REPORT_DAYS - 1))
  // 병원 번호: 진료용은 그 진료 일정 병원, 고른 병원(?careSiteId=), 안 골랐으면 대표 병원
  const hospitalParam = searchParams.get('hospital')
  const hospitalId = servedPeriod
    ? servedPeriod.careSiteId
    : (searchParams.get('careSiteId') ??
      (hospitalParam === null
        ? (hospitals[0]?.id ?? null)
        : (hospitals.find((item) => item.name === hospitalParam)?.id ?? null)))
  const profileName = useProfileStore((state) => state.name)
  // 다시 연 저장 리포트의 빈칸(놓친 측정 알림). 진료용은 위 기간 응답에 같이 옴
  const reportId = searchParams.get('reportId')
  const [savedMissed, setSavedMissed] = useState<{
    id: string
    missed: ReportMissed | null
  } | null>(null)
  useEffect(() => {
    if (!reportId || reportVisitId) return
    let canceled = false
    getSavedReportMissed(reportId)
      .then((missed) => {
        if (!canceled) setSavedMissed({ id: reportId, missed })
      })
      // 못 받으면 기기 기록으로 빈칸을 셈
      .catch(() => {})
    return () => {
      canceled = true
    }
  }, [reportId, reportVisitId])
  const missed = servedPeriod?.missed ?? (savedMissed?.id === reportId ? savedMissed.missed : null)
  // 리포트 기간 기록을 서버와 맞춤. 앱 켤 때 받지 않는 31일보다 오래된 기록도 반영
  useRangeSync(from, to)
  const { report, title, periodLabel, criteriaLines } = useReportContent({
    from,
    to,
    missed,
    hideName,
    hospitalId,
    // 진료용은 그 진료 일정의 병원으로(병원이 없으면 대표 병원)
    hospitalName: servedPeriod
      ? (servedPeriod.careSiteName ?? undefined)
      : (hospitalParam ?? undefined),
  })
  const fileName = getReportFileName(hideName ? null : profileName, from, to)

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
    const careSiteId = Number(hospitalId)
    // 진료 기간을 받았으면 진료용, 날짜 미정이거나 기간을 골랐으면 보이는 기간 그대로 기간 직접
    const body: VisitReportSave =
      servedPeriod && reportVisitId
        ? { kind: 'VISIT', visitId: Number(reportVisitId) }
        : {
            kind: 'CUSTOM',
            from: toDateKey(from),
            to: toDateKey(to),
            careSiteId: hospitalId && Number.isFinite(careSiteId) ? careSiteId : undefined,
          }
    // 못 남기면 기기에 두고 다음에 다시 보냄. 리포트 전하기는 그대로
    keepVisitReport(body)
  }

  // 기간을 받는 중이면 잠깐 기다리게, 못 받았으면 다시 받음. 화면과 다른 기간이 남지 않게
  const waitPeriod = () => {
    if (periodFailed) {
      setPeriodTry((count) => count + 1)
      setToast('진료 기간을 불러오지 못했어요. 다시 불러올게요')
      return true
    }
    if (periodPending) setToast('진료 기간을 불러오는 중이에요. 잠시 후 다시 해 주세요')
    return periodPending
  }

  const printReport = () => {
    if (waitPeriod()) return
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
    highs: report.highs.length,
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
    if (waitPeriod()) return
    setShareOpen(false)
    const node = receiptRef.current
    if (!node || savingPhoto) return
    setSavingPhoto(true)
    try {
      // 미리 만든 게 없거나 낡았으면 지금 만듦(이때는 아이폰이 공유 창을 막으면 내려받기로)
      const blob =
        photo.current?.key === photoKey ? photo.current.blob : await createReportImage(node)
      const result = await saveReportImage(blob, `${fileName}.png`)
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

  // 글로 공유. 공유 창이 없으면 복사
  const shareText = async (text: string) => {
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

  // 공유하기: 리포트 이미지를 파일로. 파일 공유가 안 되는 기기면 바로 글로
  const shareReport = async () => {
    if (waitPeriod()) return
    const text = formatReportText({ report, title, periodLabel, criteriaLines, questions })
    keepReport()
    setShareOpen(false)
    // 이미지를 지금 만들면 누른 직후가 아니라 공유 창이 막혀서, 미리 만든 게 있을 때만 파일로
    const blob = photo.current?.key === photoKey ? photo.current.blob : null
    if (blob) {
      const result = await shareReportImage(blob, `${fileName}.png`)
      if (result === 'shared' || result === 'canceled') return
      // 시도했다 막혔으면 공유 창을 또 못 띄우니 새로 누르게
      if (result === 'failed') {
        setToastAction({ label: '글로 보내기', onClick: () => void shareText(text) })
        setToast('파일로 공유하지 못했어요')
        return
      }
    }
    await shareText(text)
  }

  const closeShare = useCallback(() => setShareOpen(false), [])
  const closeToast = useCallback(() => {
    setToast(null)
    setToastAction(null)
  }, [])

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
            onClick={() => !waitPeriod() && setShareOpen(true)}
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
            createdAt={now}
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
        {toast && <Toast message={toast} action={toastAction ?? undefined} onClose={closeToast} />}
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
