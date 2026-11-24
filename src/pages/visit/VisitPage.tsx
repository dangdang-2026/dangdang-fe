import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import iconEdit from '@/assets/icons/edit.svg'
import iconFileGrey from '@/assets/icons/file-grey.svg'
import Toast from '@/components/common/Toast'
import WarmBackground from '@/components/common/WarmBackground'
import CriteriaCard from '@/components/visit/CriteriaCard'
import NextVisitCard from '@/components/visit/NextVisitCard'
import ReportCard from '@/components/visit/ReportCard'
import VisitDoneCard from '@/components/visit/VisitDoneCard'
import VisitMenuRow from '@/components/visit/VisitMenuRow'
import QuestionSheet from '@/components/visit/QuestionSheet'
import QuestionsCard from '@/components/visit/QuestionsCard'
import VisitDateSheet from '@/components/visit/VisitDateSheet'
import { getErrorCode } from '@/api/axios'
import { getVisitReportPeriod } from '@/api/visitReports'
import { ROUTES } from '@/constants/routes'
import { useNow } from '@/hooks/useNow'
import {
  deleteQuestion,
  restoreDeletedQuestion,
  saveNextVisit,
  saveQuestion,
  useVisitSaveStore,
  useVisitStore,
} from '@/stores/useVisitStore'
import type { Question } from '@/types/visit'
import { formatMonthDay, startOfDay } from '@/utils/date'
import { getVisitStatus, getVisitedDay } from '@/utils/visit'

type DateSheet = 'first' | 'edit' | null
type ToastState = { message: string; action?: { label: string; onClick: () => void } }

function VisitPage() {
  const navigate = useNavigate()
  const nextVisitAt = useVisitStore((state) => state.nextVisitAt)
  const asked = useVisitStore((state) => state.asked)
  // 첫 진입이면 다음 진료일부터 물어봄
  const [dateSheet, setDateSheet] = useState<DateSheet>(() => (asked ? null : 'first'))
  const questions = useVisitStore((state) => state.questions)
  const [questionSheetOpen, setQuestionSheetOpen] = useState(false)
  // 진료 후 메모 정리에서 다음 진료일만 바꾸고 오면 안내
  const savedToast = (useLocation().state as { toast?: string } | null)?.toast
  const [toast, setToast] = useState<ToastState | null>(() =>
    savedToast ? { message: savedToast } : null,
  )

  const now = useNow()
  const status = getVisitStatus(nextVisitAt, now)
  const visitedDay = getVisitedDay(nextVisitAt, now)

  // 리포트 화면과 같은 조건: 진료 일정이 오늘 이후면 서버 진료 기간, 아니면 최근 2주
  const visitId = useVisitStore((state) => state.visitId)
  const upcoming = !!nextVisitAt && startOfDay(new Date(nextVisitAt)) >= startOfDay(now)
  const forVisit = upcoming && !!visitId
  // 진료일 저장 중엔 받지 않고, 저장이 끝날 때마다(version) 다시 받음. 저장 전 기간이 남지 않게
  const visitSaving = useVisitSaveStore((state) => state.saving > 0)
  const visitVersion = useVisitSaveStore((state) => state.version)
  const reportKey = forVisit && !visitSaving ? `${visitId}|${nextVisitAt}|${visitVersion}` : null
  const [reportPeriod, setReportPeriod] = useState<{
    key: string
    period: { from: Date; to: Date } | null | 'loading'
  } | null>(null)
  useEffect(() => {
    if (!reportKey || !visitId) return
    let canceled = false
    // 날짜 미정이면 리포트 화면 기본처럼 최근 2주로, 그 밖 실패는 미확정(진료 탭에 다시 오면 다시 받음)
    getVisitReportPeriod(visitId)
      .then(({ from, to }) => ({ from, to }))
      .catch((error: unknown) =>
        getErrorCode(error) === 'VISIT_40003' ? null : ('loading' as const),
      )
      .then((period) => {
        if (!canceled) setReportPeriod({ key: reportKey, period })
      })
    return () => {
      canceled = true
    }
  }, [reportKey, visitId])
  const visitPeriod = !forVisit
    ? null
    : reportKey && reportPeriod?.key === reportKey
      ? reportPeriod.period
      : 'loading'

  // 화면엔 바로 바꾸고, 서버에 못 남기면 되돌린 뒤 안내
  const saveVisit = useCallback((at: string | null) => {
    saveNextVisit(at).catch(() =>
      setToast({ message: '다음 진료일을 저장하지 못했어요. 잠시 후 다시 시도해 주세요' }),
    )
  }, [])

  const closeDateSheet = useCallback(() => {
    // 처음 묻기를 그냥 닫아도 다시 묻지 않음
    if (!asked) saveVisit(null)
    setDateSheet(null)
  }, [asked, saveVisit])

  const handleSave = (at: Date) => {
    saveVisit(at.toISOString())
    setDateSheet(null)
  }

  const handleUnknown = () => {
    saveVisit(null)
    setDateSheet(null)
  }

  // 화면엔 바로 넣고 서버에 못 남기면 빼고 안내
  const handleAddQuestion = (text: string) => {
    saveQuestion(text).catch(() =>
      setToast({ message: '물어볼 것을 저장하지 못했어요. 잠시 후 다시 시도해 주세요' }),
    )
    setQuestionSheetOpen(false)
  }

  // 지운 직후 토스트에서 원래 자리로 되돌릴 수 있게
  const handleRemoveQuestion = (question: Question) => {
    const index = questions.findIndex((item) => item.id === question.id)
    deleteQuestion(question, index).catch(() =>
      setToast({ message: '질문을 지우지 못했어요. 잠시 후 다시 시도해 주세요' }),
    )
    setToast({
      message: '질문을 지웠어요',
      action: {
        label: '되돌리기',
        onClick: () =>
          restoreDeletedQuestion(question, index).catch(() =>
            setToast({ message: '질문을 되돌리지 못했어요. 잠시 후 다시 시도해 주세요' }),
          ),
      },
    })
  }

  const closeToast = useCallback(() => setToast(null), [])
  const closeQuestionSheet = useCallback(() => setQuestionSheetOpen(false), [])
  const visitLabel = status.kind === 'unknown' ? undefined : `${formatMonthDay(status.at)} 진료`

  return (
    <main className="px-5 pt-15.5">
      <WarmBackground />
      <header className="flex items-center justify-between">
        <h1 className="text-title-2 text-grey-900">진료</h1>
        <button
          type="button"
          aria-label="다음 진료일 고치기"
          className="shadow-icon-button flex size-10.5 items-center justify-center rounded-full bg-white"
          onClick={() => setDateSheet('edit')}
        >
          <img src={iconEdit} alt="" width={20} height={20} />
        </button>
      </header>

      <div className="mt-4">
        {visitedDay ? (
          <VisitDoneCard day={visitedDay} onWrite={() => navigate(ROUTES.VISIT_NOTE)} />
        ) : (
          <NextVisitCard status={status} onEdit={() => setDateSheet('edit')} />
        )}
      </div>
      {/* Figma C-02 카드 간격 12 · 28 · 14px */}
      <div className="mt-3">
        <QuestionsCard
          questions={questions}
          onAdd={() => setQuestionSheetOpen(true)}
          onRemove={handleRemoveQuestion}
        />
      </div>
      <div className="mt-7">
        <ReportCard
          today={startOfDay(now)}
          visitPeriod={visitPeriod}
          onCreate={() => navigate(ROUTES.VISIT_REPORT)}
          onPast={() => navigate(ROUTES.VISIT_REPORTS)}
        />
      </div>
      <div className="mt-3.5">
        <CriteriaCard
          onChange={() => navigate(ROUTES.VISIT_CRITERIA)}
          onNote={() => navigate(ROUTES.VISIT_NOTE)}
          onHistory={() => navigate(ROUTES.VISIT_CRITERIA_HISTORY)}
        />
      </div>
      <section className="shadow-card mt-4 rounded-3xl bg-white px-4.5 py-3.5">
        <VisitMenuRow
          icon={iconFileGrey}
          title="공식 자료"
          description="믿을 수 있는 곳의 자료만 모았어요"
          onClick={() => navigate(ROUTES.VISIT_RESOURCES)}
        />
      </section>

      {dateSheet && (
        <VisitDateSheet
          editing={dateSheet === 'edit'}
          initialAt={status.kind === 'unknown' ? null : status.at}
          today={startOfDay(now)}
          onSave={handleSave}
          onUnknown={handleUnknown}
          onClose={closeDateSheet}
        />
      )}
      {questionSheetOpen && (
        <QuestionSheet
          visitLabel={visitLabel}
          onSave={handleAddQuestion}
          onClose={closeQuestionSheet}
        />
      )}
      {toast && <Toast message={toast.message} action={toast.action} onClose={closeToast} />}
    </main>
  )
}

export default VisitPage
