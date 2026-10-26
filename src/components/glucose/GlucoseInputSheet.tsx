import { useEffect, useState } from 'react'
import iconChevronRight from '@/assets/icons/chevron-right.svg'
import iconClock from '@/assets/icons/clock-sm.svg'
import iconInfo from '@/assets/icons/info.svg'
import iconPhone from '@/assets/icons/phone.svg'
import GlucoseKeypad from '@/components/glucose/GlucoseKeypad'
import TargetChip from '@/components/glucose/TargetChip'
import { GLUCOSE_MAX_DIGITS, ON_TIME_MS } from '@/constants/glucose'
import { MOCK_USER } from '@/mocks/user'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import type { GlucoseRecord, MeasureTarget } from '@/types/glucose'
import { formatTime } from '@/utils/date'
import { compareToTarget, getSlotLabel, getTarget, isValidGlucose } from '@/utils/glucose'

type GlucoseInputSheetProps = {
  target: MeasureTarget
  onClose: () => void
  onSaved: (record: GlucoseRecord) => void
}

// 예: 측정 13:12 · 제시간 / 12분 늦게
function getMeasuredLabel(measuredAt: Date, dueAt?: string) {
  const time = `측정 ${formatTime(measuredAt)}`
  if (!dueAt) return time

  const diff = measuredAt.getTime() - new Date(dueAt).getTime()
  if (Math.abs(diff) <= ON_TIME_MS) return `${time} · 제시간`
  const minutes = Math.round(Math.abs(diff) / 60000)
  return `${time} · ${minutes}분 ${diff > 0 ? '늦게' : '일찍'}`
}

// Figma G-01~G-08 혈당 입력 바텀시트
function GlucoseInputSheet({ target, onClose, onSaved }: GlucoseInputSheetProps) {
  const addRecord = useGlucoseStore((state) => state.addRecord)
  const [measuredAt] = useState(() => new Date())
  const [digits, setDigits] = useState('')
  const [triedSave, setTriedSave] = useState(false)

  const value = Number(digits)
  const goal = getTarget(target.slot, MOCK_USER.targets, MOCK_USER.postMealHours)
  const comparison = compareToTarget(value, goal)
  // 세 자리부터 또는 저장 시도 후 비교 결과 표시
  const showResult = digits.length >= 3 || triedSave
  const isInvalid = showResult && comparison === 'invalid'

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleDigit = (digit: string) => {
    setDigits((prev) => {
      if (prev.length >= GLUCOSE_MAX_DIGITS) return prev
      if (prev === '' && digit === '0') return prev
      return prev + digit
    })
  }

  const handleSave = () => {
    if (!isValidGlucose(value)) {
      setTriedSave(true)
      return
    }
    onSaved(addRecord(target, value, measuredAt))
  }

  const numberColor = digits === '' ? 'text-grey-400' : isInvalid ? 'text-red-500' : 'text-grey-900'

  return (
    <div className="fixed inset-0 z-60">
      <button
        type="button"
        aria-label="닫기"
        className="bg-dim animate-fade-in absolute inset-0"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="혈당 입력"
        className="rounded-t-sheet shadow-sheet animate-sheet-up absolute bottom-0 left-1/2 flex w-full max-w-107.5 -translate-x-1/2 flex-col gap-4.5 bg-white px-5 pt-13 pb-[max(--spacing(9),env(safe-area-inset-bottom))] motion-reduce:animate-none"
      >
        <span className="bg-grey-100 absolute top-2 left-1/2 h-1 w-20 -translate-x-1/2 rounded-full" />

        <div className="flex items-center justify-between">
          <div className="flex flex-col items-start gap-1">
            <h2 className="text-t4 text-grey-900">
              {getSlotLabel(target.slot, target.mealType, MOCK_USER.postMealHours)}
            </h2>
            <p className="text-grey-800 flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs leading-normal font-bold">
              <img src={iconClock} alt="" width={12} height={12} />
              {getMeasuredLabel(measuredAt, target.dueAt)}
            </p>
          </div>
          {/* 알림 연동 전이라 시트만 닫음 */}
          <button
            type="button"
            className="bg-grey-100 text-t7 text-grey-600 rounded-full px-3 py-2 font-bold"
            onClick={onClose}
          >
            10분 뒤 다시
          </button>
        </div>

        <div className="flex flex-col items-center gap-1.5 py-3.5">
          <p className="flex items-baseline gap-1.5" aria-live="polite">
            <span className={`text-display ${numberColor}`}>{digits || '0'}</span>
            <span className="text-grey-400 text-base leading-normal font-medium">mg/dL</span>
          </p>
          {showResult && <TargetChip comparison={comparison} target={goal} />}
        </div>

        <button
          type="button"
          className="bg-grey-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-left"
        >
          <img src={iconPhone} alt="" width={18} height={18} />
          <span className="text-grey-700 flex-1 text-sm leading-normal font-medium">
            병원에서 들은 연락 기준
          </span>
          <img src={iconChevronRight} alt="" width={18} height={18} />
        </button>

        <GlucoseKeypad
          onDigit={handleDigit}
          onDelete={() => setDigits((prev) => prev.slice(0, -1))}
        />

        {showResult && comparison === 'high' && (
          <p className="text-grey-500 flex items-center justify-center gap-1.5 text-xs leading-normal">
            <img src={iconInfo} alt="" width={14} height={14} />
            목표는 병원에서 들은 대로 직접 적은 값이에요.
          </p>
        )}

        <button
          type="button"
          disabled={digits === ''}
          className="text-subtitle-1 disabled:bg-grey-100 disabled:text-grey-400 bg-primary h-14 rounded-xl leading-none text-white"
          onClick={handleSave}
        >
          저장
        </button>
      </section>
    </div>
  )
}

export default GlucoseInputSheet
