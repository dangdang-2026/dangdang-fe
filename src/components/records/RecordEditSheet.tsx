import { useState } from 'react'
import iconInfo from '@/assets/icons/info-md.svg'
import iconTrash from '@/assets/icons/trash.svg'
import BottomSheet from '@/components/common/BottomSheet'
import TimeWheelSheet from '@/components/common/TimeWheelSheet'
import { GLUCOSE_MAX, GLUCOSE_MAX_DIGITS, GLUCOSE_MIN } from '@/constants/glucose'
import { useNow } from '@/hooks/useNow'
import { useCriteriaStore } from '@/stores/useCriteriaStore'
import { editRecord } from '@/stores/useGlucoseStore'
import type { GlucoseRecord } from '@/types/glucose'
import { getCriteriaAt } from '@/utils/criteria'
import { formatMonthDay, formatTime } from '@/utils/date'
import { getSlotLabel, isValidGlucose } from '@/utils/glucose'

type RecordEditSheetProps = {
  record: GlucoseRecord
  onClose: () => void
  onSaved: () => void
  onDelete: () => void
}

const FIELD_CLASS = 'flex h-14 items-center gap-2 rounded-2xl px-4 border-2'

// Figma D-05·D-06 혈당 기록 수정 시트. 수치·측정 시각만 고침
function RecordEditSheet({ record, onClose, onSaved, onDelete }: RecordEditSheetProps) {
  const measuredAt = new Date(record.measuredAt)
  const now = useNow()
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const [digits, setDigits] = useState(String(record.value))
  const [time, setTime] = useState(formatTime(measuredAt))
  const criteria = getCriteriaAt(
    useCriteriaStore((state) => state.versions),
    measuredAt,
  )
  const [timeSheet, setTimeSheet] = useState(false)

  const value = Number(digits)
  const isInvalid = !isValidGlucose(value)

  const [hours, minutes] = time.split(':').map(Number)
  const nextMeasuredAt = new Date(measuredAt)
  nextMeasuredAt.setHours(hours, minutes)
  // 서버가 지금보다 뒤 시각은 받지 않음
  const isFuture = nextMeasuredAt > now

  const handleSave = async () => {
    if (isInvalid || isFuture || saving) return
    // 바뀐 게 없으면 서버가 거절해서 그냥 닫음
    if (value === record.value && nextMeasuredAt.getTime() === measuredAt.getTime()) {
      onClose()
      return
    }
    setSaving(true)
    setSaveFailed(false)
    try {
      await editRecord(record.id, { value, measuredAt: nextMeasuredAt.toISOString() })
      onSaved()
    } catch {
      setSaveFailed(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet label="기록 수정" onClose={onClose}>
      <div className="flex items-center justify-between">
        <h2 className="text-t4 text-grey-900">
          {getSlotLabel(record.slot, record.mealType, criteria.postMealHours)}
        </h2>
        <span className="bg-grey-100 text-grey-600 rounded-full px-2.5 py-1 text-xs leading-normal font-bold">
          {formatMonthDay(measuredAt)}
        </span>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-t7 text-grey-700 font-bold">혈당</span>
        <span
          className={`${FIELD_CLASS} bg-grey-50 focus-within:border-primary border-transparent focus-within:bg-white`}
        >
          <input
            type="text"
            inputMode="numeric"
            aria-label="혈당"
            value={digits}
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
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-t7 text-grey-700 font-bold">측정 시각</span>
        {/* 24시간 표기. 누르면 D-16 시간 휠 시트 */}
        <button
          type="button"
          className={`${FIELD_CLASS} bg-grey-50 border-transparent text-left`}
          onClick={() => setTimeSheet(true)}
        >
          <span className="text-grey-900 flex-1 text-base leading-normal font-medium">{time}</span>
          <span className="text-grey-500 text-sm leading-normal font-medium">바꾸기</span>
        </button>
      </div>

      <p className="bg-grey-50 rounded-key flex items-center gap-2 px-3.5 py-3">
        <img src={iconInfo} alt="" width={16} height={16} />
        <span
          className={`text-body-3 ${isInvalid || isFuture || saveFailed ? 'text-red-500' : 'text-grey-700'}`}
          role={saveFailed ? 'alert' : undefined}
        >
          {isInvalid
            ? `${GLUCOSE_MIN}~${GLUCOSE_MAX} 사이 숫자인지 확인해 주세요`
            : isFuture
              ? '잰 시각은 지금보다 뒤일 수 없어요'
              : saveFailed
                ? '고치지 못했어요. 잠시 후 다시 시도해 주세요'
                : '고치면 진료 리포트에 ‘수정됨’으로 표시돼요'}
        </span>
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
        className="text-t6 flex items-center justify-center gap-1.5 font-bold text-red-500"
        onClick={onDelete}
      >
        <img src={iconTrash} alt="" width={16} height={16} />이 기록 삭제
      </button>
      {timeSheet && (
        <TimeWheelSheet
          title="잰 시각"
          value={time}
          onDone={(next) => {
            setTime(next)
            setTimeSheet(false)
          }}
          onClose={() => setTimeSheet(false)}
        />
      )}
    </BottomSheet>
  )
}

export default RecordEditSheet
