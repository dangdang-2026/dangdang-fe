import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import iconChevronSm from '@/assets/icons/chevron-sm.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import PostMealTimeSegment from '@/components/criteria/PostMealTimeSegment'
import TargetField from '@/components/criteria/TargetField'
import FoodChip from '@/components/meal/FoodChip'
import { GLUCOSE_MAX, GLUCOSE_MIN } from '@/constants/glucose'
import { ROUTES } from '@/constants/routes'
import { useCriteria } from '@/hooks/useCriteria'
import { useGoBack } from '@/hooks/useGoBack'
import { useCriteriaStore } from '@/stores/useCriteriaStore'
import type { CriteriaPrefill, MeasureSlotKey } from '@/types/criteria'
import {
  MEASURE_SLOT_LABEL,
  MEASURE_SLOT_ORDER,
  diffCriteria,
  formatDuration,
  isValidTarget,
  toTarget,
} from '@/utils/criteria'
import { formatMonthDay } from '@/utils/date'

// Figma C-09 진료 후 기준 반영. 오늘부터 새 버전으로 적용
function CriteriaPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.VISIT)
  const current = useCriteria()
  const addCriteria = useCriteriaStore((state) => state.addCriteria)
  // 진료 후 메모 정리에서 왔으면 체크한 값으로 채움
  const prefill = (useLocation().state as { prefill?: CriteriaPrefill } | null)?.prefill ?? {}
  const [hours, setHours] = useState(prefill.postMealHours ?? current.postMealHours ?? 1)
  const [slots, setSlots] = useState<MeasureSlotKey[]>(current.measureSlots)
  const [fasting, setFasting] = useState(String(prefill.fasting ?? current.targets.fasting ?? ''))
  const [postMeal, setPostMeal] = useState(
    String(prefill.postMeal ?? current.targets.postMeal ?? ''),
  )

  const draft = {
    postMealHours: hours,
    measureSlots: MEASURE_SLOT_ORDER.filter((key) => slots.includes(key)),
    targets: { fasting: toTarget(fasting), postMeal: toTarget(postMeal) },
  }
  const changes = diffCriteria(current, draft)
  const isValid = isValidTarget(fasting) && isValidTarget(postMeal) && slots.length > 0

  const toggleSlot = (key: MeasureSlotKey) => {
    setSlots((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]))
  }

  const handleSave = () => {
    addCriteria({ ...draft, source: '진료 후 직접 입력' })
    // 저장 뒤 이력에서 새 기준 확인
    navigate(ROUTES.VISIT_CRITERIA_HISTORY, { replace: true, state: { saved: true } })
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-30">
      <SubPageHeader title="기준 바꾸기" onBack={goBack} />

      <div className="mt-3 flex flex-col gap-1.5">
        <h2 className="text-title-2 text-grey-900">
          진료에서 새 기준을
          <br />
          들으셨나요?
        </h2>
        <p className="text-grey-500 text-sm leading-normal">진료에서 들은 그대로 적어 주세요.</p>
      </div>

      <div className="mt-7 flex flex-col gap-5">
        <section className="flex flex-col gap-2">
          <h3 className="text-grey-700 text-sm leading-normal font-bold">측정 시점</h3>
          <PostMealTimeSegment value={hours} onChange={setHours} />
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-grey-700 text-sm leading-normal font-bold">재는 때</h3>
          <div className="flex flex-wrap gap-2">
            {MEASURE_SLOT_ORDER.map((key) => (
              <FoodChip
                key={key}
                name={MEASURE_SLOT_LABEL[key]}
                selected={slots.includes(key)}
                onClick={() => toggleSlot(key)}
              />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="flex items-center gap-1.5">
            <span className="text-grey-700 text-sm leading-normal font-bold">목표</span>
            <span className="text-grey-400 text-xs leading-normal font-normal">
              비워 두면 비교하지 않아요
            </span>
          </h3>
          <div className="flex gap-2.5">
            <TargetField label="공복" value={fasting} onChange={setFasting} />
            <TargetField
              label={`식후 ${formatDuration(hours)}`}
              value={postMeal}
              onChange={setPostMeal}
            />
          </div>
          {!isValid && (
            <p className="text-t7 text-red-500">
              {slots.length === 0
                ? '재는 때를 하나 이상 골라 주세요'
                : `${GLUCOSE_MIN}~${GLUCOSE_MAX} 사이 숫자인지 확인해 주세요`}
            </p>
          )}
        </section>

        <section className="rounded-banner flex flex-col gap-2 bg-yellow-50 p-4.5">
          <h3 className="text-t6 text-grey-900 font-bold">바뀌는 것</h3>
          {changes.length === 0 ? (
            <p className="text-grey-600 text-sm leading-normal">지금 기준과 같아요</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {changes.map(({ label, from, to }) => (
                <li key={label} className="flex items-center gap-2 text-sm leading-normal">
                  <span className="text-grey-600 flex-1 font-medium">{label}</span>
                  <span className="text-grey-400">{from}</span>
                  <img src={iconChevronSm} alt="→" width={14} height={14} />
                  <span className="text-grey-900 font-bold">{to}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-grey-500 text-xs leading-normal">
            {formatMonthDay(new Date())}부터 적용 · 이전 기록은 그때 기준으로 표시해요
          </p>
        </section>
      </div>

      <div className="fixed bottom-[max(--spacing(9),env(safe-area-inset-bottom))] left-1/2 w-full max-w-107.5 -translate-x-1/2 px-5">
        <button
          type="button"
          disabled={!isValid || changes.length === 0}
          className="text-subtitle-1 disabled:bg-grey-100 disabled:text-grey-400 bg-primary h-14 w-full rounded-xl leading-none text-white"
          onClick={handleSave}
        >
          이 기준으로 바꾸기
        </button>
      </div>
    </main>
  )
}

export default CriteriaPage
