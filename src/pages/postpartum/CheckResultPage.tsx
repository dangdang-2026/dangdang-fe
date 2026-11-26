import { useCallback, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import iconChevron from '@/assets/icons/postpartum/chevron-md.svg'
import iconPlus from '@/assets/icons/postpartum/plus.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { savePostpartumCheckResult, useProfileStore } from '@/stores/useProfileStore'
import { formatMonthDay, parseDateKey } from '@/utils/date'

const MEMO_MAX = 300

// Figma E-11 산후 검사 결과 메모. 해석 없이 들은 그대로만
function CheckResultPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  const goBack = useGoBack(ROUTES.TODAY)
  const [searchParams] = useSearchParams()
  const checks = useProfileStore((state) => state.postpartumChecks)
  const check = checks.find((item) => item.id === searchParams.get('id'))
  const [memo, setMemo] = useState(check?.memo ?? '')

  if (!check) return <Navigate to={ROUTES.TODAY} replace />
  const date = parseDateKey(check.date)

  // 메모를 서버에 저장하고 다음 화면으로. 비었거나 그대로면 저장 없이 이동
  const saveMemoAndGo = (to: string, replace: boolean) => {
    const trimmed = memo.trim()
    if (saving) return
    if (!trimmed || trimmed === check.memo) {
      navigate(to, { replace })
      return
    }
    setSaving(true)
    savePostpartumCheckResult(check.id, trimmed)
      .then(() => navigate(to, { replace }))
      .catch(() => {
        setToast('결과 메모를 저장하지 못했어요. 잠시 후 다시 시도해 주세요')
        setSaving(false)
      })
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-2 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
      <SubPageHeader title="검사 결과 메모" onBack={goBack} />

      <div className="mt-3 flex flex-col gap-1.5">
        <h1 className="text-t3 text-grey-900">병원에서 들은 그대로 적어 주세요</h1>
        <p className="text-grey-600 text-sm leading-relaxed">
          당당은 결과를 해석하거나 다음 검사 시기를 정하지 않아요.
        </p>
      </div>

      <div className="mt-5.5 mb-8 flex flex-col gap-5.5">
        <section className="flex flex-col gap-2">
          <h2 className="text-grey-600 text-sm leading-snug font-medium">검사</h2>
          <p className="bg-grey-50 rounded-key text-grey-900 py-3.5 pr-3.5 pl-4 text-base leading-snug font-medium">
            {check.name}
            {date && ` · ${formatMonthDay(date)}`}
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <label htmlFor="check-memo" className="text-grey-600 text-sm leading-snug font-medium">
            메모
          </label>
          <textarea
            id="check-memo"
            value={memo}
            maxLength={MEMO_MAX}
            placeholder="선생님께 들은 말을 그대로 적어 주세요"
            className="border-grey-200 focus:border-primary text-grey-900 placeholder:text-grey-400 rounded-key h-35 resize-none border-2 px-4 py-3.5 text-base leading-relaxed outline-none"
            onChange={(event) => setMemo(event.target.value)}
          />
        </section>

        <button
          type="button"
          className="bg-grey-50 rounded-key flex items-center gap-2.5 py-3.5 pr-3.5 pl-4 text-left"
          // 적어 둔 메모는 먼저 저장하고 다음 일정으로
          onClick={() => saveMemoAndGo(ROUTES.POSTPARTUM_CHECK, false)}
        >
          <img src={iconPlus} alt="" width={20} height={20} />
          <span className="flex flex-1 flex-col gap-0.5 leading-snug">
            <span className="text-t7 text-grey-700 leading-snug">다음 검사 날짜를 들으셨나요?</span>
            <span className="text-t6 text-grey-900 leading-snug font-bold">
              다음 검사 일정 등록하기
            </span>
          </span>
          <img src={iconChevron} alt="" width={16} height={16} />
        </button>
      </div>

      <button
        type="button"
        disabled={!memo.trim() || saving}
        className="bg-primary disabled:bg-grey-100 disabled:text-grey-400 rounded-key mt-auto py-4 text-base leading-snug font-bold text-white"
        onClick={() => saveMemoAndGo(ROUTES.TODAY, true)}
      >
        저장
      </button>
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default CheckResultPage
