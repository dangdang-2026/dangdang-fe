import { useState } from 'react'
import { createPortal } from 'react-dom'
import { getErrorCode } from '@/api/axios'
import iconChevron from '@/assets/icons/nav-next.svg'
import BottomSheet from '@/components/common/BottomSheet'
import TimeWheelSheet from '@/components/common/TimeWheelSheet'
import ProfileDateSheet from '@/components/my/ProfileDateSheet'
import { GLUCOSE_MAX, GLUCOSE_MAX_DIGITS, GLUCOSE_MIN } from '@/constants/glucose'
import { useNow } from '@/hooks/useNow'
import { useCriteriaStore } from '@/stores/useCriteriaStore'
import { editRecord, useGlucoseStore } from '@/stores/useGlucoseStore'
import type { MeasureSlotKey } from '@/types/criteria'
import type { GlucoseRecord, MeasureTarget } from '@/types/glucose'
import { getCriteriaAt, MEASURE_SLOT_LABEL, MEASURE_SLOT_ORDER } from '@/utils/criteria'
import { formatMonthDay, formatTime, isSameDay, startOfDay } from '@/utils/date'
import { getSlotLabel, isValidGlucose } from '@/utils/glucose'

type RecordEditSheetProps = {
  record: GlucoseRecord
  onClose: () => void
  onSaved: () => void
  onDelete: () => void
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 시점 칩 하나 → 서버 시점. 식후는 그 끼니
const SLOT_TARGET: Record<MeasureSlotKey, Pick<MeasureTarget, 'slot' | 'mealType'>> = {
  fasting: { slot: 'fasting' },
  breakfast: { slot: 'post-meal', mealType: 'breakfast' },
  lunch: { slot: 'post-meal', mealType: 'lunch' },
  dinner: { slot: 'post-meal', mealType: 'dinner' },
  bedtime: { slot: 'bedtime' },
}

const toSlotKey = (record: Pick<GlucoseRecord, 'slot' | 'mealType'>): MeasureSlotKey =>
  record.slot === 'post-meal' ? (record.mealType ?? 'lunch') : record.slot

// 서버 거절 이유별 안내
const SAVE_ERROR: Record<string, string> = {
  READING_40903: '다른 곳에서 먼저 고쳤어요. 새로 불러온 기록을 확인해 주세요',
  READING_40401: '이미 지운 기록이에요',
  READING_40005: '식후 혈당은 그 식사를 시작한 뒤 시각으로 골라 주세요',
}

// Figma D-05·D-06 혈당 기록 고치기. 수치 · 시점 · 날짜 · 잰 시각
function RecordEditSheet({
  record: initialRecord,
  onClose,
  onSaved,
  onDelete,
}: RecordEditSheetProps) {
  // 충돌(409)로 새로 받으면 새 기록 기준으로 다시 보여 줌
  const [record, setRecord] = useState(initialRecord)
  const measuredAt = new Date(record.measuredAt)
  const now = useNow()
  const meals = useGlucoseStore((state) => state.meals)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  // HI · LO 기록은 600 · 20 대신 빈칸에 그 글자를 흐리게. 숫자를 적으면 숫자 기록으로
  const [digits, setDigits] = useState(record.meterLimit ? '' : String(record.value))
  const [slotKey, setSlotKey] = useState<MeasureSlotKey>(toSlotKey(record))
  const [day, setDay] = useState(startOfDay(measuredAt))
  const [time, setTime] = useState(formatTime(measuredAt))
  const [picker, setPicker] = useState<'slot' | 'date' | 'time' | null>(null)
  const criteria = getCriteriaAt(
    useCriteriaStore((state) => state.versions),
    day,
  )

  const value = Number(digits)
  // HI · LO 기록을 빈칸 그대로 두면 글자를 지킴
  const keepMeterLimit = !!record.meterLimit && digits === ''
  const isInvalid = !keepMeterLimit && !isValidGlucose(value)

  const [hours, minutes] = time.split(':').map(Number)
  const nextMeasuredAt = new Date(day)
  nextMeasuredAt.setHours(hours, minutes)
  // 서버가 지금보다 뒤 시각은 받지 않음
  const isFuture = nextMeasuredAt > now
  const target = SLOT_TARGET[slotKey]
  const slotChanged = slotKey !== toSlotKey(record)
  // 식후로 바꾸거나 날짜를 옮기면 그날 그 끼니 식사에 붙임(서버에 있는 식사만)
  const meal =
    target.slot === 'post-meal'
      ? meals.find(
          (item) =>
            !item.pending &&
            item.type === target.mealType &&
            isSameDay(new Date(item.startedAt), nextMeasuredAt),
        )
      : undefined
  // 식후 혈당은 식사 시작보다 앞일 수 없음(서버도 READING_40005로 막음)
  const beforeMeal = !!meal && nextMeasuredAt < new Date(meal.startedAt)
  const dayChanged = !isSameDay(day, measuredAt)
  // 식사에 붙은 식후 혈당을 그 끼니 식사가 없는 날 · 끼니로 옮기면 서버가 예전 식사 연결을 그대로 둬서 막음
  const noMeal =
    target.slot === 'post-meal' && (slotChanged || dayChanged) && !meal && !!record.mealId

  const handleSave = async () => {
    if (isInvalid || isFuture || beforeMeal || noMeal || saving) return
    // 바뀐 게 없으면 서버가 거절해서 그냥 닫음
    // HI · LO 기록(값 600 · 20)에 숫자를 적었으면 같은 숫자라도 바뀐 것
    const sameValue = keepMeterLimit || (!record.meterLimit && value === record.value)
    if (sameValue && !slotChanged && nextMeasuredAt.getTime() === measuredAt.getTime()) {
      onClose()
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      await editRecord(record.id, {
        ...(!keepMeterLimit && { value }),
        measuredAt: nextMeasuredAt.toISOString(),
        ...(slotChanged && { target }),
        ...((slotChanged || dayChanged) && meal && { mealId: meal.id }),
      })
      onSaved()
    } catch (error) {
      const code = getErrorCode(error) ?? ''
      // 충돌이면 다시 받은 값으로 칸을 바꿔 옛 값으로 덮어쓰지 않게
      const fresh = useGlucoseStore.getState().records.find((item) => item.id === record.id)
      if (code === 'READING_40903' && fresh) {
        setRecord(fresh)
        setDigits(fresh.meterLimit ? '' : String(fresh.value))
        setSlotKey(toSlotKey(fresh))
        setDay(startOfDay(new Date(fresh.measuredAt)))
        setTime(formatTime(new Date(fresh.measuredAt)))
      }
      // 이미 지운 기록이면 목록에서 빠졌으니 닫음
      if (code === 'READING_40401') return onClose()
      setSaveError(SAVE_ERROR[code] ?? '고치지 못했어요. 잠시 후 다시 시도해 주세요')
    } finally {
      setSaving(false)
    }
  }

  const notice = isInvalid
    ? `${GLUCOSE_MIN}~${GLUCOSE_MAX} 사이 숫자인지 확인해 주세요`
    : isFuture
      ? '잰 시각은 지금보다 뒤일 수 없어요'
      : beforeMeal
        ? `식사를 ${formatTime(new Date(meal.startedAt))}에 시작했어요. 그 뒤 시각으로 골라 주세요`
        : noMeal
          ? `그날 ${MEASURE_SLOT_LABEL[slotKey].replace(' 식후', '')} 식사 기록이 없어요. 식사를 먼저 적어 주세요`
          : saveError
  const row = (label: string, value: string, onClick: () => void) => (
    <button type="button" className="flex h-13 items-center gap-2 px-4 text-left" onClick={onClick}>
      <span className="text-grey-700 flex-1 text-sm leading-normal">{label}</span>
      <span className="text-grey-900 text-t6 font-bold">{value}</span>
      <img src={iconChevron} alt="" width={18} height={18} />
    </button>
  )

  return (
    <BottomSheet label="혈당 기록 고치기" onClose={onClose}>
      <h2 className="text-t4 text-grey-900">혈당 기록 고치기</h2>

      <label className="flex flex-col gap-2">
        <span className="text-t7 text-grey-700 font-bold">혈당</span>
        <span className="bg-grey-50 focus-within:border-primary flex h-14 items-center gap-2 rounded-2xl border-2 border-transparent px-4 focus-within:bg-white">
          <input
            type="text"
            inputMode="numeric"
            aria-label="혈당"
            value={digits}
            placeholder={record.meterLimit ?? undefined}
            className={`min-w-0 flex-1 bg-transparent text-base leading-normal font-medium outline-none ${
              isInvalid ? 'text-red-500' : 'text-grey-900'
            }`}
            onChange={(event) => {
              const next = event.target.value.replace(/\D/g, '').replace(/^0+/, '')
              setDigits(next.slice(0, GLUCOSE_MAX_DIGITS))
            }}
          />
          <span className="text-grey-500 text-sm leading-normal font-medium">mg/dL</span>
        </span>
        {/* 서버가 남긴 처음 값. 처음 값으로 되돌렸거나 안 고쳤으면 없음 */}
        {(record.originalValue != null || record.originalMeterLimit) && record.editedAt && (
          <span className="text-caption text-grey-600 leading-normal">
            처음 {record.originalMeterLimit ?? record.originalValue} ·{' '}
            {formatMonthDay(new Date(record.editedAt))} {formatTime(new Date(record.editedAt))}에
            고침
          </span>
        )}
      </label>

      <div className="bg-grey-50 rounded-key divide-grey-100 flex flex-col divide-y">
        {row('시점', getSlotLabel(target.slot, target.mealType, criteria.postMealHours), () =>
          setPicker(picker === 'slot' ? null : 'slot'),
        )}
        {/* 시점은 그 자리에서 칩으로 고름 */}
        {picker === 'slot' && (
          <div className="grid grid-cols-3 gap-2 p-3" role="radiogroup" aria-label="시점">
            {MEASURE_SLOT_ORDER.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={slotKey === key}
                className={`h-10 rounded-xl text-sm font-medium ${
                  slotKey === key ? 'bg-grey-900 text-white' : 'text-grey-700 bg-white'
                }`}
                onClick={() => {
                  setSlotKey(key)
                  setPicker(null)
                }}
              >
                {MEASURE_SLOT_LABEL[key]}
              </button>
            ))}
          </div>
        )}
        {row('날짜', `${formatMonthDay(day)} (${WEEKDAYS[day.getDay()]})`, () => setPicker('date'))}
        {row('측정 시각', time, () => setPicker('time'))}
      </div>

      <p
        className={`bg-grey-50 rounded-key text-body-3 px-4 py-3.5 ${notice ? 'text-red-500' : 'text-grey-700'}`}
        role={saveError ? 'alert' : undefined}
      >
        {notice ?? '고치면 진료 리포트에 ‘수정됨’으로 표시돼요'}
      </p>

      <button
        type="button"
        aria-busy={saving}
        className="text-subtitle-1 bg-primary h-14 rounded-xl leading-none text-white"
        onClick={() => void handleSave()}
      >
        수정 저장
      </button>
      <button
        type="button"
        className="text-t6 flex h-11 items-center justify-center font-medium text-red-700"
        onClick={onDelete}
      >
        이 기록 지우기
      </button>
      {picker === 'time' && (
        <TimeWheelSheet
          title="잰 시각"
          value={time}
          onDone={(next) => {
            setTime(next)
            setPicker(null)
          }}
          onClose={() => setPicker(null)}
        />
      )}
      {/* 날짜 시트도 화면 기준으로 뜨게 body로 */}
      {picker === 'date' &&
        createPortal(
          <ProfileDateSheet
            title="잰 날짜"
            description="언제 잰 혈당인지 골라 주세요."
            initialDate={day}
            today={startOfDay(now)}
            pick="past"
            onSave={(date) => {
              setDay(startOfDay(date))
              setPicker(null)
            }}
            onClose={() => setPicker(null)}
          />,
          document.body,
        )}
    </BottomSheet>
  )
}

export default RecordEditSheet
