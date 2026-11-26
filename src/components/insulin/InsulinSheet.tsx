import { useState } from 'react'
import type { InsulinInput } from '@/api/insulin'
import iconCheck from '@/assets/icons/insulin/check.svg'
import iconClock from '@/assets/icons/insulin/clock.svg'
import iconMinus from '@/assets/icons/insulin/minus.svg'
import iconPlus from '@/assets/icons/insulin/plus.svg'
import iconTrash from '@/assets/icons/trash.svg'
import BottomSheet from '@/components/common/BottomSheet'
import TimeWheelSheet from '@/components/common/TimeWheelSheet'
import type { InsulinRecord, MealType } from '@/types/glucose'
import {
  INSULIN_KIND_LABEL,
  INSULIN_MEAL_LABEL,
  formatTakenAt,
  guessMealType,
} from '@/utils/insulin'

// 서버가 받는 최대 단위(999.9)보다 작게, 화면에선 100까지
const UNITS_MAX = 100

type InsulinKindChoice = InsulinInput['kind']

type InsulinSheetProps = {
  // 있으면 고치기
  record?: InsulinRecord
  // 저장이 끝날 때까지 기다림. 실패하면 시트가 그대로 남음
  onSave: (input: InsulinInput) => Promise<void> | void
  // 고치기에서 지우기 확인으로 넘김
  onDelete?: () => void
  onClose: () => void
}

// 'HH:MM' 그 날 그 시각으로. 지금보다 뒤면 서버가 받지 않아 전날 그 시각으로
function withTime(date: Date, time: string, now: Date) {
  const [hours, minutes] = time.split(':').map(Number)
  const next = new Date(date)
  next.setHours(hours, minutes, 0, 0)
  if (next > now) next.setDate(next.getDate() - 1)
  return next
}

const pad = (value: number) => String(value).padStart(2, '0')

// 숫자와 소수 한 자리만. 예: '6' · '6.5'
function toUnitsText(value: string) {
  const [whole, ...rest] = value.replace(/[^\d.]/g, '').split('.')
  const fixed = rest.length > 0 ? `${whole}.${rest.join('').slice(0, 1)}` : whole
  return Number(fixed) > UNITS_MAX ? String(UNITS_MAX) : fixed
}

// Figma E-02 인슐린 기록. 단위는 빈칸에서 시작해 처방받은 대로 직접 적음, 권하지 않음
function InsulinSheet({ record, onSave, onDelete, onClose }: InsulinSheetProps) {
  const [timeSheet, setTimeSheet] = useState(false)
  const [saving, setSaving] = useState(false)
  const [takenAt, setTakenAt] = useState(record ? new Date(record.takenAt) : new Date())
  const [kind, setKind] = useState<InsulinKindChoice>(
    record?.kind === 'bedtime' ? 'bedtime' : 'meal',
  )
  const [mealType, setMealType] = useState<MealType>(record?.mealType ?? guessMealType(takenAt))
  const [unitsText, setUnitsText] = useState(record ? String(record.units) : '')
  const units = Number(unitsText)
  const blank = unitsText === '' || units === 0
  const now = new Date()

  const canSave = !blank && !saving
  const step = (delta: number) => {
    // 빈칸에서 +는 1부터, −는 그대로
    if (blank) {
      if (delta > 0) setUnitsText('1')
      return
    }
    setUnitsText(String(Math.min(UNITS_MAX, Math.max(0, Math.round((units + delta) * 10) / 10))))
  }

  const save = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await onSave({
        kind,
        mealType: kind === 'meal' ? mealType : undefined,
        units,
        takenAt: takenAt.toISOString(),
      })
    } finally {
      setSaving(false)
    }
  }

  const chip = (selected: boolean, label: string, onClick: () => void) => (
    <button
      key={label}
      type="button"
      aria-pressed={selected}
      className={`flex shrink-0 items-center gap-1 rounded-full border px-3.5 py-2 text-sm leading-normal font-bold ${
        selected
          ? 'text-grey-800 border-primary bg-yellow-50'
          : 'bg-grey-100 text-grey-700 border-transparent'
      }`}
      onClick={onClick}
    >
      {selected && <img src={iconCheck} alt="" width={14} height={14} />}
      {label}
    </button>
  )

  const stepButton = (delta: number, icon: string, label: string) => (
    <button
      type="button"
      aria-label={label}
      disabled={delta > 0 ? units >= UNITS_MAX : blank}
      className={`flex size-13 items-center justify-center rounded-full ${
        blank ? 'bg-grey-100' : 'shadow-card bg-white disabled:opacity-40'
      }`}
      onClick={() => step(delta)}
    >
      {/* 빈칸이면 −/+ 둘 다 흐리게 */}
      <img src={icon} alt="" width={20} height={20} className={blank ? 'opacity-40' : undefined} />
    </button>
  )

  return (
    <BottomSheet label={record ? '인슐린 기록 고치기' : '인슐린 기록'} onClose={onClose}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-t4 text-grey-900">{record ? '인슐린 기록 고치기' : '인슐린 기록'}</h2>
          <p className="text-t6 text-grey-700">기록만 해요. 투여 알림은 보내지 않아요.</p>
        </div>
        {!record && (
          <span className="text-grey-800 rounded-full bg-yellow-50 px-2.5 py-1 text-xs leading-normal font-bold">
            인슐린 쓰는 중
          </span>
        )}
      </div>

      <h3 className="text-grey-700 -mb-1 text-sm leading-normal font-bold">종류</h3>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(INSULIN_KIND_LABEL) as InsulinKindChoice[]).map((key) =>
            chip(kind === key, INSULIN_KIND_LABEL[key], () => setKind(key)),
          )}
        </div>
        {/* 식사 때 인슐린은 어느 끼니인지 같이 */}
        {kind === 'meal' && (
          <div className="flex flex-wrap gap-2">
            {(Object.keys(INSULIN_MEAL_LABEL) as MealType[]).map((key) =>
              chip(mealType === key, INSULIN_MEAL_LABEL[key], () => setMealType(key)),
            )}
          </div>
        )}
      </div>

      <h3 className="text-grey-700 -mb-1 text-sm leading-normal font-bold">
        단위 · <span className="text-grey-600">처방받은 대로 직접 적어 주세요</span>
      </h3>
      <div className="rounded-banner bg-grey-50 flex items-center justify-between p-4">
        {stepButton(-1, iconMinus, '1단위 줄이기')}
        <label className="flex flex-col items-center">
          {/* 숫자를 눌러 직접 적을 수도 있음. 빈칸이면 – */}
          <input
            inputMode="decimal"
            aria-label="단위"
            value={unitsText}
            placeholder="–"
            className="text-stepper text-grey-900 placeholder:text-grey-400 w-28 bg-transparent text-center outline-none"
            onChange={(event) => setUnitsText(toUnitsText(event.target.value))}
          />
          <span className="text-body-2 text-grey-700">단위</span>
        </label>
        {stepButton(1, iconPlus, '1단위 늘리기')}
      </div>

      {record && (
        <p className="text-body-3 text-grey-700 rounded-key bg-grey-100 px-4 py-3.5">
          처방받은 단위와 같은지 한 번 더 확인해 주세요
        </p>
      )}

      <h3 className="text-grey-700 -mb-1 text-sm leading-normal font-bold">시각</h3>
      <div className="bg-grey-50 flex items-center gap-2.5 rounded-2xl px-4 py-3.5">
        <img src={iconClock} alt="" width={18} height={18} />
        <span className="text-body-2 text-grey-800 flex-1">{formatTakenAt(takenAt, now)}</span>
        <button
          type="button"
          className="text-grey-800 text-sm leading-normal font-bold"
          onClick={() => setTimeSheet(true)}
        >
          바꾸기
        </button>
      </div>
      {timeSheet && (
        <TimeWheelSheet
          title="맞은 시각"
          value={`${pad(takenAt.getHours())}:${pad(takenAt.getMinutes())}`}
          onDone={(time) => {
            setTakenAt(withTime(takenAt, time, new Date()))
            setTimeSheet(false)
          }}
          onClose={() => setTimeSheet(false)}
        />
      )}

      <div className="flex flex-col gap-3">
        {blank && (
          <p className="text-grey-600 text-center text-sm leading-normal">
            단위를 적으면 저장할 수 있어요
          </p>
        )}
        <button
          type="button"
          disabled={!canSave}
          aria-busy={saving}
          className="text-subtitle-1 bg-primary disabled:bg-grey-100 disabled:text-grey-500 h-14 rounded-xl leading-none text-white"
          onClick={() => void save()}
        >
          {record ? '수정 저장' : '저장'}
        </button>
        {record && onDelete && (
          <button
            type="button"
            disabled={saving}
            className="text-t6 flex items-center justify-center gap-1.5 font-bold text-red-500"
            onClick={onDelete}
          >
            <img src={iconTrash} alt="" width={16} height={16} />이 기록 삭제
          </button>
        )}
      </div>
    </BottomSheet>
  )
}

export default InsulinSheet
