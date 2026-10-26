import { useState } from 'react'
import { useNavigate } from 'react-router'
import iconChevronSm from '@/assets/icons/chevron-sm.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import FoodChip from '@/components/meal/FoodChip'
import { GLUCOSE_MAX, GLUCOSE_MIN } from '@/constants/glucose'
import { ROUTES } from '@/constants/routes'
import { useCriteria } from '@/hooks/useCriteria'
import { useCriteriaStore } from '@/stores/useCriteriaStore'
import type { MeasureSlotKey } from '@/types/criteria'
import { MEASURE_SLOT_LABEL, MEASURE_SLOT_ORDER, diffCriteria } from '@/utils/criteria'
import { formatMonthDay } from '@/utils/date'

const HOUR_OPTIONS = [1, 2]

type TargetFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
}

// 목표 입력칸. 숫자만, 비우면 비교 안 함
function TargetField({ label, value, onChange }: TargetFieldProps) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-2">
      <span className="text-t7 text-grey-700 font-bold">{label}</span>
      <span className="bg-grey-50 focus-within:border-primary flex h-14 items-center gap-2 rounded-2xl border-2 border-transparent px-4 focus-within:bg-white">
        <input
          type="text"
          inputMode="numeric"
          aria-label={`${label} 목표`}
          placeholder="비움"
          value={value}
          className="text-grey-900 placeholder:text-grey-400 min-w-0 flex-1 bg-transparent text-base leading-normal font-medium outline-none"
          onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 3))}
        />
        <span className="text-grey-500 text-sm leading-normal">미만</span>
      </span>
    </label>
  )
}

const toTarget = (value: string) => (value === '' ? null : Number(value))
const isValidTarget = (value: string) =>
  value === '' || (Number(value) >= GLUCOSE_MIN && Number(value) <= GLUCOSE_MAX)

// Figma C-09 진료 후 기준 반영. 오늘부터 새 버전으로 적용
function CriteriaPage() {
  const navigate = useNavigate()
  const current = useCriteria()
  const addCriteria = useCriteriaStore((state) => state.addCriteria)
  const [hours, setHours] = useState(current.postMealHours ?? 1)
  const [slots, setSlots] = useState<MeasureSlotKey[]>(current.measureSlots)
  const [fasting, setFasting] = useState(String(current.targets.fasting ?? ''))
  const [postMeal, setPostMeal] = useState(String(current.targets.postMeal ?? ''))

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
      <SubPageHeader title="기준 바꾸기" onBack={() => navigate(ROUTES.VISIT)} />

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
          <div className="bg-grey-100 flex gap-1 rounded-2xl p-1">
            {HOUR_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={hours === option}
                className={`text-t6 flex-1 rounded-xl py-3 font-bold ${
                  hours === option ? 'shadow-segment text-grey-900 bg-white' : 'text-grey-500'
                }`}
                onClick={() => setHours(option)}
              >
                식후 {option}시간
              </button>
            ))}
          </div>
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
            <TargetField label={`식후 ${hours}시간`} value={postMeal} onChange={setPostMeal} />
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
