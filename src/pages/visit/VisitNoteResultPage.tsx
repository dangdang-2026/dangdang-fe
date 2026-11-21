import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import iconCheckDark from '@/assets/icons/check-dark.svg'
import iconEye from '@/assets/icons/eye.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import { ROUTES } from '@/constants/routes'
import { useCriteria } from '@/hooks/useCriteria'
import { useGoBack } from '@/hooks/useGoBack'
import { saveNextVisit, useVisitStore } from '@/stores/useVisitStore'
import type { CriteriaPrefill, MeasureSlotKey } from '@/types/criteria'
import type { NoteExtraction, NoteFinding, NoteFindingKey } from '@/types/visit'
import { formatMeasureSlots, formatPostMealHours, formatTarget } from '@/utils/criteria'

const LABEL: Record<NoteFindingKey, string> = {
  measureSlots: '잴 때',
  postMealHours: '측정 시점',
  postMeal: '식후 목표',
  fasting: '공복 목표',
  nextVisit: '다음 진료일',
}

type FindingItemProps = {
  finding: NoteFinding
  // 기준 항목은 지금 값 → 바뀌는 값
  from: string | null
  checked: boolean
  onToggle: () => void
}

// 찾은 항목 한 줄. 애매해도 값은 보여 주고 확인 필요를 붙임
function FindingItem({ finding, from, checked, onToggle }: FindingItemProps) {
  const value = from ? `${from} → ${finding.text}` : finding.text

  // 테두리 두께를 같게 둬서 체크할 때 흔들리지 않게
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      className={`rounded-key flex w-full items-start gap-3 border-2 px-4 py-3.5 text-left ${
        checked ? 'border-primary' : 'border-grey-200'
      }`}
      onClick={onToggle}
    >
      {checked ? (
        <span className="bg-primary flex size-5.5 shrink-0 items-center justify-center rounded-md">
          <img src={iconCheckDark} alt="" width={14} height={14} />
        </span>
      ) : (
        <span className="border-grey-300 size-5.5 shrink-0 rounded-md border-2" />
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-t7 text-grey-600 leading-snug font-medium">
          {LABEL[finding.key]}
          {finding.needsCheck && ' · 확인 필요'}
        </span>
        <span
          className={`text-base leading-snug font-bold ${
            finding.needsCheck ? 'text-grey-600' : 'text-grey-900'
          }`}
        >
          {value}
        </span>
        {(finding.quote || finding.needsCheck) && (
          <span className="text-t7 text-grey-600">
            {finding.quote ? `“${finding.quote}”` : ''}
            {finding.needsCheck && `${finding.quote ? ' — ' : ''}${finding.needsCheck}`}
          </span>
        )}
      </span>
    </button>
  )
}

// Figma C-12 진료 메모 AI 정리 결과. 체크한 것만 바꿈
function VisitNoteResultPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.VISIT_NOTE)
  const location = useLocation()
  const result = (location.state as { result?: NoteExtraction } | null)?.result
  const criteria = useCriteria()
  // 애매한 항목은 체크 안 한 채로 시작
  const [checked, setChecked] = useState<NoteFindingKey[]>(
    () => result?.findings.filter((item) => !item.needsCheck).map((item) => item.key) ?? [],
  )

  // 정리 결과 없이 바로 열면 메모 쓰기로
  if (!result) return <Navigate to={ROUTES.VISIT_NOTE} replace />
  const { findings, insulinSkipped } = result

  const getFrom = (key: NoteFindingKey) => {
    if (key === 'measureSlots') return formatMeasureSlots(criteria.measureSlots)
    if (key === 'postMealHours') return formatPostMealHours(criteria.postMealHours)
    if (key === 'postMeal') return formatTarget(criteria.targets.postMeal)
    if (key === 'fasting') return formatTarget(criteria.targets.fasting)
    return null
  }

  const toggle = (key: NoteFindingKey) => {
    setChecked((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    )
  }

  const handleApply = () => {
    const selected = findings.filter((item) => checked.includes(item.key))
    const prefill: CriteriaPrefill = {}
    let visitChanged = false
    for (const { key, value } of selected) {
      // 지금 진료일과 같으면 보내지 않음. 못 남기면 원래 날짜로 돌아가 진료 탭에서 다시 정함
      if (key === 'nextVisit') {
        if (String(value) === useVisitStore.getState().nextVisitAt) continue
        visitChanged = true
        saveNextVisit(String(value)).catch(() => {})
      } else if (key === 'measureSlots')
        prefill.measureSlots = String(value).split(',') as MeasureSlotKey[]
      else prefill[key] = Number(value)
    }
    // 기준 항목이 있으면 기준 바꾸기에서 전후 확인 후 저장
    if (Object.keys(prefill).length > 0) {
      navigate(ROUTES.VISIT_CRITERIA, { replace: true, state: { prefill } })
    } else {
      const toast = visitChanged ? '다음 진료일을 바꿨어요' : '다음 진료일은 그대로예요'
      navigate(ROUTES.VISIT, { replace: true, state: { toast } })
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-13 pb-[max(--spacing(7.5),env(safe-area-inset-bottom))]">
      <SubPageHeader title="정리 결과 확인" onBack={goBack} />

      <div className="mt-3 flex flex-col gap-1.5">
        <h2 className="text-t3 text-grey-900">
          {findings.length > 0 ? '메모에서 이렇게 찾았어요' : '메모에서 찾지 못했어요'}
        </h2>
        <p className="text-grey-600 text-sm leading-relaxed">
          {findings.length > 0
            ? '맞는 것만 체크해 주세요. 체크한 것만 바꿔요.'
            : '잴 때·측정 시점·목표 수치·다음 진료일이 없어요. 직접 적어 주세요.'}
        </p>
      </div>

      <div className="mt-5 mb-8 flex flex-col gap-5">
        {findings.map((finding) => (
          <FindingItem
            key={finding.key}
            finding={finding}
            from={getFrom(finding.key)}
            checked={checked.includes(finding.key)}
            onToggle={() => toggle(finding.key)}
          />
        ))}

        {insulinSkipped && (
          <p className="bg-grey-50 text-t7 text-grey-700 flex items-start gap-2 rounded-xl px-3.5 py-3 leading-relaxed">
            <img src={iconEye} alt="" width={18} height={18} className="shrink-0" />
            인슐린 · 약 이야기는 정리하지 않았어요. 약은 인슐린 기록에서 직접 적어 주세요.
          </p>
        )}
      </div>

      {findings.length > 0 ? (
        <button
          type="button"
          disabled={checked.length === 0}
          className="bg-primary disabled:bg-grey-100 disabled:text-grey-400 rounded-key mt-auto py-4 text-base leading-snug font-bold text-white"
          onClick={handleApply}
        >
          {checked.length > 0 ? `체크한 ${checked.length}개 바꾸기` : '바꿀 것을 체크해 주세요'}
        </button>
      ) : (
        <button
          type="button"
          className="bg-primary rounded-key mt-auto py-4 text-base leading-snug font-bold text-white"
          onClick={() => navigate(ROUTES.VISIT_CRITERIA, { replace: true })}
        >
          직접 바꾸기
        </button>
      )}
    </main>
  )
}

export default VisitNoteResultPage
