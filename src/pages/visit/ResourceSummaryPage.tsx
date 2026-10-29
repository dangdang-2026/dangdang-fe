import { Navigate, useParams } from 'react-router'
import iconSourceArrow from '@/assets/icons/chat/source-arrow.svg'
import iconInfoLg from '@/assets/icons/info-lg.svg'
import iconInfoSm from '@/assets/icons/info-sm.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import AskQuestionRow from '@/components/resource/AskQuestionRow'
import QuestionSheet from '@/components/visit/QuestionSheet'
import { ROUTES } from '@/constants/routes'
import { useAskQuestion } from '@/hooks/useAskQuestion'
import { useGoBack } from '@/hooks/useGoBack'
import { RESOURCE_SUMMARIES } from '@/mocks/resources'
import { openExternal } from '@/utils/link'

// Figma C-16 공식 자료 한 장 요약. 지침 문장을 그대로, 해석·권고 없음
function ResourceSummaryPage() {
  const goBack = useGoBack(ROUTES.VISIT_RESOURCES)
  const { id } = useParams()
  const summary = RESOURCE_SUMMARIES.find((item) => item.id === id)
  const ask = useAskQuestion()

  if (!summary) return <Navigate to={ROUTES.VISIT_RESOURCES} replace />

  const openSource = async (label: string, url: string | null) => {
    if (!(await openExternal(label, url))) ask.showToast('링크를 확인하고 있어요')
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-10">
      <SubPageHeader title="공식 자료 한 장 요약" onBack={goBack} />

      <div className="mt-3 flex flex-col gap-1.5">
        <p className="text-grey-600 text-xs leading-relaxed">한 장 요약 · {summary.category}</p>
        <h2 className="text-hero text-grey-900">{summary.title}</h2>
        <p className="text-grey-600 text-sm leading-relaxed">{summary.description}</p>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <h3 className="text-t7 text-grey-600 leading-relaxed">지침은 이렇게 설명해요</h3>
        <ol className="border-grey-200 overflow-hidden rounded-2xl border">
          {summary.items.map((item, index) => (
            <li
              key={item}
              className="border-grey-100 flex items-center gap-3 border-t px-4 py-3.5 first:border-t-0"
            >
              <span className="text-grey-900 flex size-5.5 shrink-0 items-center justify-center text-xs font-bold">
                {index + 1}
              </span>
              <span className="text-t6 text-grey-900 font-medium">{item}</span>
            </li>
          ))}
        </ol>

        <div className="flex flex-col items-start gap-1.5">
          {summary.sources.map((source) => (
            <button
              key={source.label}
              type="button"
              className="border-grey-200 flex items-center gap-1.5 rounded-lg border py-1.5 pr-2 pl-2.5"
              onClick={() => openSource(source.label, source.url)}
            >
              <img src={iconInfoSm} alt="" width={14} height={14} />
              <span className="text-grey-600 text-xs leading-snug font-medium">
                출처 · {source.label}
              </span>
              <img src={iconSourceArrow} alt="" width={12} height={12} />
            </button>
          ))}
        </div>

        <div className="bg-grey-50 text-t7 text-grey-700 flex items-start gap-2 rounded-xl px-3.5 py-3 leading-relaxed">
          <img src={iconInfoLg} alt="" width={18} height={18} className="shrink-0" />
          <p>
            {summary.note}
            <br />
            확인일 {summary.checkedOn} · 공식 자료 문장을 그대로 옮겼어요
          </p>
        </div>

        <AskQuestionRow label="궁금한 점이 생겼어요 · 물어볼 것에 적기" onClick={ask.openSheet} />
      </div>

      {ask.open && (
        <QuestionSheet visitLabel={ask.visitLabel} onSave={ask.save} onClose={ask.closeSheet} />
      )}
      {ask.toast && <Toast message={ask.toast} onClose={ask.closeToast} />}
    </main>
  )
}

export default ResourceSummaryPage
