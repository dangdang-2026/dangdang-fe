import { useCallback, useState, type KeyboardEvent } from 'react'
import { getErrorCode } from '@/api/axios'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import iconClock from '@/assets/icons/clock-sm.svg'
import iconInfo from '@/assets/icons/info.svg'
import BottomSheet from '@/components/common/BottomSheet'
import EmergencyBlock from '@/components/common/EmergencyBlock'
import Toast from '@/components/common/Toast'
import ContactCriteriaCard from '@/components/glucose/ContactCriteriaCard'
import GlucoseKeypad from '@/components/glucose/GlucoseKeypad'
import MeasuredTimePicker from '@/components/glucose/MeasuredTimePicker'
import TargetChip from '@/components/glucose/TargetChip'
import ContactMemoSheet from '@/components/my/ContactMemoSheet'
import { MEMO_SAVE_FAILED } from '@/constants/criteria'
import { GLUCOSE_LOW, GLUCOSE_MAX_DIGITS, ON_TIME_MS } from '@/constants/glucose'
import { ROUTES } from '@/constants/routes'
import { useCriteriaStore } from '@/stores/useCriteriaStore'
import { saveRecord } from '@/stores/useGlucoseStore'
import { saveContactMemo, useProfileStore } from '@/stores/useProfileStore'
import type { MeasureSlotKey } from '@/types/criteria'
import type { GlucoseRecord, MeasureTarget, MeterLimit } from '@/types/glucose'
import { MEASURE_SLOT_LABEL, getCriteriaAt } from '@/utils/criteria'
import { formatMonthDay, formatTime } from '@/utils/date'
import { compareToTarget, getSlotLabel, getTarget, isValidGlucose } from '@/utils/glucose'

type GlucoseInputSheetProps = {
  target: MeasureTarget
  onClose: () => void
  onSaved: (record: GlucoseRecord) => void
  // 10분 뒤 다시. 없으면 버튼 안 보임
  onSnooze?: () => void
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

// 식사를 시작한 시각 = 측정 예정 - 식후 시간. 모르면 예정 시각
function getMealStart(dueAt: string | undefined, hours: number | null) {
  const due = dueAt ? new Date(dueAt) : new Date()
  return new Date(due.getTime() - (hours ?? 0) * 60 * 60 * 1000)
}

// 저장 실패 안내. 식후 혈당이 식사 시작보다 앞이면(READING_40005) 그 이유로
const toSaveError = (error: unknown) =>
  getErrorCode(error) === 'READING_40005'
    ? '식사를 시작한 뒤 시각으로 골라 주세요'
    : '저장하지 못했어요. 잠시 후 다시 시도해 주세요'

// Figma G-11 혈당계 글자 칩
const METER_LABEL: Record<MeterLimit, string> = { HI: 'HI · 600보다 높음', LO: 'LO · 20보다 낮음' }

// 고른 글자의 「지금 먼저 할 일」. HI는 피그마 그대로, LO는 피그마에 없어 저혈당 안내와 같은 말로
const METER_MESSAGE: Record<MeterLimit, string> = {
  HI: 'HI는 혈당계로 잴 수 없을 만큼\n높다는 뜻이에요.\n지금 병원에 전화해 주세요.',
  LO: 'LO는 혈당계로 잴 수 없을 만큼\n낮다는 뜻이에요.\n병원에서 들은 저혈당 대처를 먼저 하고\n병원에 전화해 주세요.',
}

// Figma G-01~G-08 혈당 입력 바텀시트
// 시점 칩 하나 → 측정 대상. 식후는 그 끼니
const SLOT_TARGET: Record<MeasureSlotKey, MeasureTarget> = {
  fasting: { slot: 'fasting' },
  breakfast: { slot: 'post-meal', mealType: 'breakfast' },
  lunch: { slot: 'post-meal', mealType: 'lunch' },
  dinner: { slot: 'post-meal', mealType: 'dinner' },
  bedtime: { slot: 'bedtime' },
}

const isSameSlot = (a: MeasureTarget, b: MeasureTarget) =>
  a.slot === b.slot && (a.slot !== 'post-meal' || a.mealType === b.mealType)

function GlucoseInputSheet({
  target: initialTarget,
  onClose,
  onSaved,
  onSnooze,
  backfillAt,
}: GlucoseInputSheetProps) {
  const navigate = useNavigate()
  // 지금 잴 끼니가 없어 시간대로 짐작했으면 시점을 고를 수 있게(Figma G-06)
  const guessed = !initialTarget.mealId
  const [target, setTarget] = useState(initialTarget)
  // 시트를 연 시각. 늦게 잼이면 잰 시각을 이 앞으로 고름
  const [openedAt] = useState(() => backfillAt ?? new Date())
  const [measuredAt, setMeasuredAt] = useState(openedAt)
  const late =
    !backfillAt &&
    !!target.dueAt &&
    openedAt.getTime() - new Date(target.dueAt).getTime() > ON_TIME_MS
  const [digits, setDigits] = useState('')
  // 혈당계에 HI · LO가 떠서 숫자 대신 글자로 적는 중. 고른 글자
  const [meterMode, setMeterMode] = useState(false)
  const [meterLimit, setMeterLimit] = useState<MeterLimit | null>(null)
  const [triedSave, setTriedSave] = useState(false)
  const [saving, setSaving] = useState(false)
  // 저장 실패 안내. 서버 거절 이유가 있으면 그 말로
  const [saveFailed, setSaveFailed] = useState<string | null>(null)
  // 연락 기준 펼침. 직접 누르기 전엔 높음 · 낮음일 때 저절로 펼침
  const [contactOpen, setContactOpen] = useState<boolean | null>(null)
  const [memoSheet, setMemoSheet] = useState(false)
  // 메모를 서버에 못 저장하면 원래 메모로 돌아가고 알림
  const [memoFailed, setMemoFailed] = useState(false)
  const closeMemoFailed = useCallback(() => setMemoFailed(false), [])
  const contactMemo = useProfileStore((state) => state.contactMemo)
  // 측정 시각에 적용되는 기준(지난 날 채우기면 그날 기준)
  const criteria = getCriteriaAt(
    useCriteriaStore((state) => state.versions),
    measuredAt,
  )

  // 공복 · 세 끼 식후는 늘, 자기 전은 병원 기준에 있을 때만
  const slotOptions: MeasureSlotKey[] = [
    'fasting',
    'breakfast',
    'lunch',
    'dinner',
    ...(criteria.measureSlots.includes('bedtime') ? (['bedtime'] as const) : []),
  ]
  // 방향키로 앞뒤 시점을 고르고 그 칩으로 포커스. Tab은 고른 칩 하나만 거침
  const moveSlot = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
    if (!step) return
    event.preventDefault()
    const index = slotOptions.findIndex((key) => isSameSlot(target, SLOT_TARGET[key]))
    const next = (index + step + slotOptions.length) % slotOptions.length
    setTarget(SLOT_TARGET[slotOptions[next]])
    const radios = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')
    radios[next]?.focus()
  }
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
    if (meterMode) {
      if (!meterLimit) return
      setSaving(true)
      setSaveFailed(null)
      try {
        onSaved(await saveRecord(target, meterLimit, measuredAt))
      } catch (error) {
        setSaveFailed(toSaveError(error))
      } finally {
        setSaving(false)
      }
      return
    }
    // 두 자리 낮은 값은 안내를 아직 못 봤으니 먼저 보여 주고 한 번 더 누르면 저장
    if (!isValidGlucose(value) || (value < GLUCOSE_LOW && !showResult)) {
      setTriedSave(true)
      return
    }
    setSaving(true)
    setSaveFailed(null)
    try {
      onSaved(await saveRecord(target, value, measuredAt))
    } catch (error) {
      setSaveFailed(toSaveError(error))
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
            {guessed
              ? '언제 잰 혈당인가요?'
              : getSlotLabel(target.slot, target.mealType, criteria.postMealHours)}
          </h2>
          <p className="text-grey-800 flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs leading-normal font-bold">
            <img src={iconClock} alt="" width={12} height={12} />
            {backfillAt && `${formatMonthDay(backfillAt)} · `}
            {getMeasuredLabel(measuredAt, target.dueAt)}
          </p>
        </div>
        {/* 지난 날 채우기엔 없음 */}
        {onSnooze && !backfillAt && (
          <button
            type="button"
            className="bg-grey-100 text-t7 text-grey-600 rounded-full px-3 py-2 font-bold"
            onClick={onSnooze}
          >
            10분 뒤 다시
          </button>
        )}
      </div>

      {guessed && (
        <div
          className="grid grid-cols-4 gap-2"
          role="radiogroup"
          aria-label="측정 시점"
          onKeyDown={moveSlot}
        >
          {slotOptions.map((key) => {
            const selected = isSameSlot(target, SLOT_TARGET[key])
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                className={`h-11 rounded-xl text-sm font-medium ${
                  selected ? 'bg-grey-900 text-white' : 'bg-grey-100 text-grey-700'
                }`}
                onClick={() => setTarget(SLOT_TARGET[key])}
              >
                {MEASURE_SLOT_LABEL[key]}
              </button>
            )
          })}
        </div>
      )}

      {meterMode ? (
        <>
          <h3 className="text-grey-700 -mb-1 text-sm leading-normal font-bold">
            혈당계 화면에 뜬 글자를 골라 주세요
          </h3>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="혈당계 글자">
            {(['HI', 'LO'] as const).map((limit) => (
              <button
                key={limit}
                type="button"
                role="radio"
                aria-checked={meterLimit === limit}
                className={`h-13 rounded-xl border text-sm font-bold ${
                  meterLimit === limit
                    ? 'border-primary text-grey-900 bg-yellow-50'
                    : 'bg-grey-100 text-grey-700 border-transparent'
                }`}
                onClick={() => setMeterLimit(limit)}
              >
                {METER_LABEL[limit]}
              </button>
            ))}
          </div>
          {/* 고르면 바로 접지 않는 위급 안내 */}
          {meterLimit && (
            <EmergencyBlock
              message={METER_MESSAGE[meterLimit]}
              onWriteMemo={() => setMemoSheet(true)}
            />
          )}
          <button
            type="button"
            className="text-grey-600 self-center text-sm leading-normal underline"
            onClick={() => {
              setMeterMode(false)
              setMeterLimit(null)
            }}
          >
            숫자로 적을게요
          </button>
          {meterLimit && (
            <p className="text-grey-500 text-center text-xs leading-normal">
              기록에는 숫자 대신 ‘{meterLimit}’로 남아요.
            </p>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col items-center gap-1.5 py-3.5">
            <p className="flex items-baseline gap-1.5" aria-live="polite">
              <span className={`text-display ${numberColor}`}>{digits || '0'}</span>
              <span className="text-grey-400 text-base leading-normal font-medium">mg/dL</span>
            </p>
            {showResult && (
              <TargetChip
                comparison={comparison}
                target={goal}
                low={isLow}
                hasMemo={!!contactMemo}
                onSetTarget={() => {
                  onClose()
                  navigate(ROUTES.MY_CRITERIA)
                }}
              />
            )}
          </div>

          {/* 70 미만이면 접지 않는 위급 안내로 */}
          {isLow ? (
            <EmergencyBlock onWriteMemo={() => setMemoSheet(true)} />
          ) : (
            <ContactCriteriaCard
              expanded={contactExpanded}
              onToggle={() => setContactOpen(!contactExpanded)}
              onWriteMemo={() => setMemoSheet(true)}
            />
          )}

          <GlucoseKeypad
            onDigit={handleDigit}
            onDelete={() => setDigits((prev) => prev.slice(0, -1))}
            onMeterLimit={() => {
              setMeterMode(true)
              setDigits('')
              setTriedSave(false)
            }}
          />
        </>
      )}

      {late && (
        <MeasuredTimePicker
          now={openedAt}
          earliest={getMealStart(target.dueAt, criteria.postMealHours)}
          value={measuredAt}
          onChange={setMeasuredAt}
        />
      )}

      {showResult && (comparison === 'high' || (isLow && goal !== null)) && (
        <p className="text-grey-500 flex items-center justify-center gap-1.5 text-xs leading-normal">
          <img src={iconInfo} alt="" width={14} height={14} />
          목표는 병원에서 들은 대로 직접 적은 값이에요.
        </p>
      )}

      {saveFailed && (
        <p className="text-t7 text-center text-red-500" role="alert">
          {saveFailed}
        </p>
      )}

      <button
        type="button"
        disabled={meterMode ? !meterLimit : digits === ''}
        aria-busy={saving}
        className="text-subtitle-1 disabled:bg-grey-100 disabled:text-grey-400 bg-primary h-14 rounded-xl leading-none text-white"
        onClick={() => void handleSave()}
      >
        {meterMode && meterLimit ? `${meterLimit}로 저장` : '저장'}
      </button>

      {/* 혈당 시트 안에서 열어도 화면 기준으로 뜨게 body로 */}
      {memoSheet &&
        createPortal(
          <ContactMemoSheet
            initialMemo={contactMemo}
            onSave={(memo) => {
              saveContactMemo(memo).catch(() => setMemoFailed(true))
              setMemoSheet(false)
            }}
            onClose={() => setMemoSheet(false)}
          />,
          document.body,
        )}
      {/* 혈당 시트(z-60) 위에 보이게 */}
      {memoFailed &&
        createPortal(
          <div className="relative z-70">
            <Toast message={MEMO_SAVE_FAILED} onClose={closeMemoFailed} />
          </div>,
          document.body,
        )}
    </BottomSheet>
  )
}

export default GlucoseInputSheet
