import { useState } from 'react'
import { createPortal } from 'react-dom'
import iconClock from '@/assets/icons/clock-sm.svg'
import iconInfo from '@/assets/icons/info.svg'
import BottomSheet from '@/components/common/BottomSheet'
import ContactCriteriaCard from '@/components/glucose/ContactCriteriaCard'
import GlucoseKeypad from '@/components/glucose/GlucoseKeypad'
import MeasuredTimePicker from '@/components/glucose/MeasuredTimePicker'
import TargetChip from '@/components/glucose/TargetChip'
import ContactMemoSheet from '@/components/my/ContactMemoSheet'
import { GLUCOSE_LOW, GLUCOSE_MAX_DIGITS, ON_TIME_MS } from '@/constants/glucose'
import { useCriteriaStore } from '@/stores/useCriteriaStore'
import { saveRecord } from '@/stores/useGlucoseStore'
import { useProfileStore } from '@/stores/useProfileStore'
import type { GlucoseRecord, MeasureTarget } from '@/types/glucose'
import { getCriteriaAt } from '@/utils/criteria'
import { formatMonthDay, formatTime } from '@/utils/date'
import { compareToTarget, getSlotLabel, getTarget, isValidGlucose } from '@/utils/glucose'

type GlucoseInputSheetProps = {
  target: MeasureTarget
  onClose: () => void
  onSaved: (record: GlucoseRecord) => void
  // 지난 날 나중에 채울 때 측정 시각. 없으면 지금
  backfillAt?: Date
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
function GlucoseInputSheet({ target, onClose, onSaved, backfillAt }: GlucoseInputSheetProps) {
  // 시트를 연 시각. 늦게 잼이면 잰 시각을 이 앞으로 고름
  const [openedAt] = useState(() => backfillAt ?? new Date())
  const [measuredAt, setMeasuredAt] = useState(openedAt)
  const late =
    !backfillAt &&
    !!target.dueAt &&
    openedAt.getTime() - new Date(target.dueAt).getTime() > ON_TIME_MS
  const [digits, setDigits] = useState('')
  const [triedSave, setTriedSave] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  // 연락 기준 펼침. 직접 누르기 전엔 높음 · 낮음일 때 저절로 펼침
  const [contactOpen, setContactOpen] = useState<boolean | null>(null)
  const [memoSheet, setMemoSheet] = useState(false)
  const contactMemo = useProfileStore((state) => state.contactMemo)
  const updateProfile = useProfileStore((state) => state.updateProfile)
  // 측정 시각에 적용되는 기준(지난 날 채우기면 그날 기준)
  const criteria = getCriteriaAt(
    useCriteriaStore((state) => state.versions),
    measuredAt,
  )

  const value = Number(digits)
  const goal = getTarget(target.slot, criteria.targets, criteria.postMealHours)
  const comparison = compareToTarget(value, goal)
  // 세 자리부터 또는 저장 시도 후 비교 결과 표시
  const showResult = digits.length >= 3 || triedSave
  const isInvalid = showResult && comparison === 'invalid'
  // 70 미만은 목표가 없어도 안내
  const isLow = showResult && comparison !== 'invalid' && value < GLUCOSE_LOW
  const contactExpanded = contactOpen ?? (isLow || (showResult && comparison === 'high'))

  const handleDigit = (digit: string) => {
    setDigits((prev) => {
      if (prev.length >= GLUCOSE_MAX_DIGITS) return prev
      if (prev === '' && digit === '0') return prev
      return prev + digit
    })
  }

  const handleSave = async () => {
    if (saving) return
    if (!isValidGlucose(value)) {
      setTriedSave(true)
      return
    }
    setSaving(true)
    setSaveFailed(false)
    try {
      onSaved(await saveRecord(target, value, measuredAt))
    } catch {
      setSaveFailed(true)
    } finally {
      setSaving(false)
    }
  }

  const numberColor = digits === '' ? 'text-grey-400' : isInvalid ? 'text-red-500' : 'text-grey-900'

  return (
    <BottomSheet label="혈당 입력" onClose={onClose}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <h2 className="text-t4 text-grey-900">
            {getSlotLabel(target.slot, target.mealType, criteria.postMealHours)}
          </h2>
          <p className="text-grey-800 flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs leading-normal font-bold">
            <img src={iconClock} alt="" width={12} height={12} />
            {backfillAt && `${formatMonthDay(backfillAt)} · `}
            {getMeasuredLabel(measuredAt, target.dueAt)}
          </p>
        </div>
        {/* 알림 연동 전이라 시트만 닫음. 지난 날 채우기엔 없음 */}
        {!backfillAt && (
          <button
            type="button"
            className="bg-grey-100 text-t7 text-grey-600 rounded-full px-3 py-2 font-bold"
            onClick={onClose}
          >
            10분 뒤 다시
          </button>
        )}
      </div>

      <div className="flex flex-col items-center gap-1.5 py-3.5">
        <p className="flex items-baseline gap-1.5" aria-live="polite">
          <span className={`text-display ${numberColor}`}>{digits || '0'}</span>
          <span className="text-grey-400 text-base leading-normal font-medium">mg/dL</span>
        </p>
        {showResult && <TargetChip comparison={comparison} target={goal} low={isLow} />}
      </div>

      <ContactCriteriaCard
        expanded={contactExpanded}
        onToggle={() => setContactOpen(!contactExpanded)}
        onWriteMemo={() => setMemoSheet(true)}
      />

      <GlucoseKeypad
        onDigit={handleDigit}
        onDelete={() => setDigits((prev) => prev.slice(0, -1))}
      />

      {late && <MeasuredTimePicker now={openedAt} value={measuredAt} onChange={setMeasuredAt} />}

      {showResult && (comparison === 'high' || (isLow && goal !== null)) && (
        <p className="text-grey-500 flex items-center justify-center gap-1.5 text-xs leading-normal">
          <img src={iconInfo} alt="" width={14} height={14} />
          목표는 병원에서 들은 대로 직접 적은 값이에요.
        </p>
      )}

      {saveFailed && (
        <p className="text-t7 text-center text-red-500" role="alert">
          저장하지 못했어요. 잠시 후 다시 시도해 주세요
        </p>
      )}

      <button
        type="button"
        disabled={digits === ''}
        aria-busy={saving}
        className="text-subtitle-1 disabled:bg-grey-100 disabled:text-grey-400 bg-primary h-14 rounded-xl leading-none text-white"
        onClick={() => void handleSave()}
      >
        저장
      </button>

      {/* 혈당 시트 안에서 열어도 화면 기준으로 뜨게 body로 */}
      {memoSheet &&
        createPortal(
          <ContactMemoSheet
            initialMemo={contactMemo}
            onSave={(memo) => {
              updateProfile({ contactMemo: memo })
              setMemoSheet(false)
            }}
            onClose={() => setMemoSheet(false)}
          />,
          document.body,
        )}
    </BottomSheet>
  )
}

export default GlucoseInputSheet
