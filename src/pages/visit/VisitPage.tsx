import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import iconEdit from '@/assets/icons/edit.svg'
import Toast from '@/components/common/Toast'
import WarmBackground from '@/components/common/WarmBackground'
import CriteriaCard from '@/components/visit/CriteriaCard'
import NextVisitCard from '@/components/visit/NextVisitCard'
import ReportCard from '@/components/visit/ReportCard'
import QuestionSheet from '@/components/visit/QuestionSheet'
import QuestionsCard from '@/components/visit/QuestionsCard'
import VisitDateSheet from '@/components/visit/VisitDateSheet'
import { ROUTES } from '@/constants/routes'
import { useNow } from '@/hooks/useNow'
import { useVisitStore } from '@/stores/useVisitStore'
import type { Question } from '@/types/visit'
import { formatMonthDay, startOfDay } from '@/utils/date'
import { getVisitStatus } from '@/utils/visit'

type DateSheet = 'first' | 'edit' | null
type ToastState = { message: string; action?: { label: string; onClick: () => void } }

function VisitPage() {
  const navigate = useNavigate()
  const nextVisitAt = useVisitStore((state) => state.nextVisitAt)
  const asked = useVisitStore((state) => state.asked)
  const setNextVisit = useVisitStore((state) => state.setNextVisit)
  // 첫 진입이면 다음 진료일부터 물어봄
  const [dateSheet, setDateSheet] = useState<DateSheet>(() => (asked ? null : 'first'))
  const questions = useVisitStore((state) => state.questions)
  const addQuestion = useVisitStore((state) => state.addQuestion)
  const removeQuestion = useVisitStore((state) => state.removeQuestion)
  const restoreQuestion = useVisitStore((state) => state.restoreQuestion)
  const [questionSheetOpen, setQuestionSheetOpen] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const now = useNow()
  const status = getVisitStatus(nextVisitAt, now)

  const closeDateSheet = useCallback(() => {
    // 처음 묻기를 그냥 닫아도 다시 묻지 않음
    if (!asked) setNextVisit(null)
    setDateSheet(null)
  }, [asked, setNextVisit])

  const handleSave = (at: Date) => {
    setNextVisit(at.toISOString())
    setDateSheet(null)
  }

  const handleUnknown = () => {
    setNextVisit(null)
    setDateSheet(null)
  }

  const handleAddQuestion = (text: string) => {
    addQuestion(text)
    setQuestionSheetOpen(false)
  }

  // 지운 직후 토스트에서 원래 자리로 되돌릴 수 있게
  const handleRemoveQuestion = (question: Question) => {
    const index = questions.findIndex((item) => item.id === question.id)
    removeQuestion(question.id)
    setToast({
      message: '질문을 지웠어요',
      action: { label: '되돌리기', onClick: () => restoreQuestion(question, index) },
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
        <NextVisitCard status={status} onEdit={() => setDateSheet('edit')} />
      </div>
      <div className="mt-4">
        <QuestionsCard
          questions={questions}
          onAdd={() => setQuestionSheetOpen(true)}
          onRemove={handleRemoveQuestion}
        />
      </div>
      <div className="mt-4">
        <ReportCard today={startOfDay(now)} onCreate={() => navigate(ROUTES.VISIT_REPORT)} />
      </div>
      <div className="mt-4">
        <CriteriaCard
          onChange={() => navigate(ROUTES.VISIT_CRITERIA)}
          onHistory={() => navigate(ROUTES.VISIT_CRITERIA_HISTORY)}
        />
      </div>

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
