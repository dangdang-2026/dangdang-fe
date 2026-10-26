import { useRef, useState } from 'react'
import iconInfo from '@/assets/icons/info-md.svg'
import iconTrash from '@/assets/icons/trash.svg'
import BottomSheet from '@/components/common/BottomSheet'
import { GLUCOSE_MAX, GLUCOSE_MAX_DIGITS, GLUCOSE_MIN } from '@/constants/glucose'
import { MOCK_USER } from '@/mocks/user'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import type { GlucoseRecord } from '@/types/glucose'
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
  const updateRecord = useGlucoseStore((state) => state.updateRecord)
  const measuredAt = new Date(record.measuredAt)
  const [digits, setDigits] = useState(String(record.value))
  const [time, setTime] = useState(formatTime(measuredAt))
  const timeInputRef = useRef<HTMLInputElement>(null)

  const value = Number(digits)
  const isInvalid = !isValidGlucose(value)

  const handleSave = () => {
    if (isInvalid) return
    const [hours, minutes] = time.split(':').map(Number)
    const next = new Date(measuredAt)
    next.setHours(hours, minutes)
    updateRecord(record.id, { value, measuredAt: next.toISOString() })
    onSaved()
  }

  const openTimePicker = () => {
    const input = timeInputRef.current
    if (!input) return
    if (typeof input.showPicker === 'function') input.showPicker()
    else input.focus()
  }

  return (
    <BottomSheet label="기록 수정" onClose={onClose}>
      <div className="flex items-center justify-between">
        <h2 className="text-t4 text-grey-900">
          {getSlotLabel(record.slot, record.mealType, MOCK_USER.postMealHours)}
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
        {/* 기기 시간 형식과 무관하게 24시간 표기. 누르면 기본 시간 선택기 */}
        <button
          type="button"
          className={`${FIELD_CLASS} bg-grey-50 relative border-transparent text-left`}
          onClick={openTimePicker}
        >
          <span className="text-grey-900 flex-1 text-base leading-normal font-medium">{time}</span>
          <span className="text-grey-500 text-sm leading-normal font-medium">바꾸기</span>
          <input
            ref={timeInputRef}
            type="time"
            tabIndex={-1}
            aria-label="측정 시각"
            value={time}
            className="pointer-events-none absolute inset-0 opacity-0"
            onChange={(event) => event.target.value && setTime(event.target.value)}
          />
        </button>
      </div>

      <p className="bg-grey-50 rounded-key flex items-center gap-2 px-3.5 py-3">
        <img src={iconInfo} alt="" width={16} height={16} />
        <span className={`text-body-3 ${isInvalid ? 'text-red-500' : 'text-grey-700'}`}>
          {isInvalid
            ? `${GLUCOSE_MIN}~${GLUCOSE_MAX} 사이 숫자인지 확인해 주세요`
            : '고치면 진료 리포트에 ‘수정됨’으로 표시돼요'}
        </span>
      </p>

      <button
        type="button"
        className="text-subtitle-1 bg-primary h-14 rounded-xl leading-none text-white"
        onClick={handleSave}
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
    </BottomSheet>
  )
}

export default RecordEditSheet
