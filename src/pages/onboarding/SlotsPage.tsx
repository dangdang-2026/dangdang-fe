import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import OnboardingHeader from '@/components/onboarding/OnboardingHeader'
import FoodChip from '@/components/meal/FoodChip'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import type { MeasureSlotKey } from '@/types/criteria'
import { MEASURE_SLOT_LABEL, MEASURE_SLOT_ORDER } from '@/utils/criteria'
import { formatMeridiemTime } from '@/utils/date'

// 예: 07:00 → 오전 7:00
const formatTimeKey = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return formatMeridiemTime(new Date(2000, 0, 1, hours, minutes))
}

// Figma A-02b 재는 때(병원에서 들은 것만)
function SlotsPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.ONBOARDING_TIMING)
  const saved = useOnboardingStore((state) => state.measureSlots)
  const setAnswers = useOnboardingStore((state) => state.setAnswers)
  const fastingTime = useNotificationStore((state) => state.fastingTime)
  const setFastingTime = useNotificationStore((state) => state.setFastingTime)
  const [slots, setSlots] = useState<MeasureSlotKey[]>(saved)
  const timeInputRef = useRef<HTMLInputElement>(null)

  const toggle = (key: MeasureSlotKey) =>
    setSlots((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]))

  // 네이티브 시간 선택 창 열기
  const openTimePicker = () => {
    const input = timeInputRef.current
    if (!input) return
    if (typeof input.showPicker === 'function') input.showPicker()
    else input.focus()
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-13 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
      <OnboardingHeader step={1} onBack={goBack} />

      <div className="mt-4.5 flex flex-col gap-6">
        <h1 className="text-title-2 text-grey-900">
          병원에서 언제
          <br />
          재라고 안내받으셨나요?
        </h1>
        <p className="text-grey-500 text-sm leading-normal">
          들은 때만 골라 주세요. 고른 때에만 알림이 와요.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {MEASURE_SLOT_ORDER.map((key) => (
          <FoodChip
            key={key}
            name={MEASURE_SLOT_LABEL[key]}
            selected={slots.includes(key)}
            onClick={() => toggle(key)}
          />
        ))}
      </div>

      {slots.includes('fasting') && (
        <button
          type="button"
          className="bg-grey-50 relative mt-6 flex items-center gap-2 rounded-xl py-3 pr-3.5 pl-4 text-left text-sm leading-snug"
          onClick={openTimePicker}
        >
          <span className="text-grey-800 flex-1 font-medium">공복 알림</span>
          <span className="text-grey-900 font-bold">{formatTimeKey(fastingTime)}</span>
          <span className="text-t7 text-grey-500 font-medium">바꾸기</span>
          <input
            ref={timeInputRef}
            type="time"
            tabIndex={-1}
            aria-label="공복 알림 시각"
            value={fastingTime}
            className="pointer-events-none absolute inset-0 opacity-0"
            onChange={(event) => event.target.value && setFastingTime(event.target.value)}
          />
        </button>
      )}

      <p className="text-grey-500 mt-6 text-xs leading-normal">
        공복·자기 전은 식사 시작이 없어서 정한 시각에 알려 드려요. 병원에서 들은 시각이 있으면 바꿔
        주세요.
      </p>
      <p className="text-grey-500 mt-6 text-sm leading-normal">
        아직 모르면 비워 두세요. 식사 시작을 누를 때만 식후 알림이 와요.
      </p>

      <button
        type="button"
        className="text-subtitle-1 bg-primary mt-auto h-14 rounded-xl leading-none text-white"
        onClick={() => {
          setAnswers({ measureSlots: MEASURE_SLOT_ORDER.filter((key) => slots.includes(key)) })
          navigate(ROUTES.ONBOARDING_DUE_DATE)
        }}
      >
        다음
      </button>
    </main>
  )
}

export default SlotsPage
