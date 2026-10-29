import { useRef, useState } from 'react'
import iconCheck from '@/assets/icons/insulin/check.svg'
import iconClock from '@/assets/icons/insulin/clock.svg'
import iconInfo from '@/assets/icons/insulin/info.svg'
import iconMinus from '@/assets/icons/insulin/minus.svg'
import iconPlus from '@/assets/icons/insulin/plus.svg'
import BottomSheet from '@/components/common/BottomSheet'
import type { InsulinKind, InsulinRecord } from '@/types/glucose'
import { INSULIN_KIND_LABEL, formatTakenAt } from '@/utils/insulin'

const UNITS_MAX = 100

type InsulinInput = Pick<InsulinRecord, 'kind' | 'name' | 'units' | 'takenAt'>

type InsulinSheetProps = {
  // 있으면 D-10 고치기
  record?: InsulinRecord
  // 새로 적을 때 단위 시작값. 같은 종류로 마지막에 적은 값
  lastUnits?: Partial<Record<InsulinKind, number>>
  onSave: (input: InsulinInput) => void
  onClose: () => void
}

// 'HH:MM' 그 날 그 시각으로
function withTime(date: Date, time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  const next = new Date(date)
  next.setHours(hours, minutes, 0, 0)
  return next
}

const pad = (value: number) => String(value).padStart(2, '0')

// Figma E-02 인슐린 기록 · D-10 고치기. 단위를 권하지 않고 처방 확인만 안내
function InsulinSheet({ record, lastUnits = {}, onSave, onClose }: InsulinSheetProps) {
  const timeRef = useRef<HTMLInputElement>(null)
  const [kind, setKind] = useState<InsulinKind>(record?.kind ?? 'meal')
  const [name, setName] = useState(record?.name ?? '')
  const [units, setUnits] = useState(record?.units ?? lastUnits[record?.kind ?? 'meal'] ?? 0)
  const [takenAt, setTakenAt] = useState(record ? new Date(record.takenAt) : new Date())
  const now = new Date()

  const chooseKind = (next: InsulinKind) => {
    setKind(next)
    // 새로 적을 땐 그 종류로 마지막에 적은 단위부터
    if (!record && lastUnits[next] !== undefined) setUnits(lastUnits[next])
  }

  const canSave = units > 0 && (kind !== 'custom' || !!name.trim())

  const chip = (value: InsulinKind, label: string) => {
    const selected = kind === value
    return (
      <button
        key={value}
        type="button"
        aria-pressed={selected}
        className={`flex shrink-0 items-center gap-1 rounded-full border px-3.5 py-2 text-sm leading-normal font-bold ${
          selected
            ? 'text-grey-800 border-primary bg-yellow-50'
            : 'bg-grey-100 text-grey-700 border-transparent'
        }`}
        onClick={() => chooseKind(value)}
      >
        {selected && <img src={iconCheck} alt="" width={14} height={14} />}
        {label}
      </button>
    )
  }

  return (
    <BottomSheet label="인슐린 기록" onClose={onClose}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-t4 text-grey-900">인슐린 기록</h2>
          <p className="text-t6 text-grey-700">기록만 해요. 투여 알림은 보내지 않아요.</p>
        </div>
        <span className="text-grey-800 rounded-full bg-yellow-50 px-2.5 py-1 text-xs leading-normal font-bold">
          인슐린 모드
        </span>
      </div>

      <h3 className="text-grey-700 -mb-1 text-sm leading-normal font-bold">종류</h3>
      {/* Figma처럼 한 줄. 좁은 화면에선 옆으로 밀어서 봄 */}
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 whitespace-nowrap">
        {(Object.keys(INSULIN_KIND_LABEL) as Exclude<InsulinKind, 'custom'>[]).map((key) =>
          chip(key, INSULIN_KIND_LABEL[key]),
        )}
        {chip('custom', '직접 입력')}
      </div>
      {kind === 'custom' && (
        <input
          value={name}
          maxLength={20}
          aria-label="인슐린 이름"
          placeholder="인슐린 이름을 적어 주세요"
          className="bg-grey-50 text-grey-900 placeholder:text-grey-400 focus:ring-primary rounded-2xl px-4 py-3.5 text-base leading-snug font-medium outline-none focus:ring-2"
          onChange={(event) => setName(event.target.value)}
        />
      )}

      <h3 className="text-grey-700 -mb-1 text-sm leading-normal font-bold">단위</h3>
      <div className="rounded-banner bg-grey-50 flex items-center justify-between p-4">
        <button
          type="button"
          aria-label="1단위 줄이기"
          disabled={units <= 0}
          className="shadow-card flex size-13 items-center justify-center rounded-full bg-white disabled:opacity-40"
          onClick={() => setUnits((value) => Math.max(0, value - 1))}
        >
          <img src={iconMinus} alt="" width={20} height={20} />
        </button>
        <label className="flex flex-col items-center">
          {/* 숫자를 눌러 직접 적을 수도 있음 */}
          <input
            inputMode="numeric"
            aria-label="단위"
            value={units}
            className="text-stepper text-grey-900 w-28 bg-transparent text-center outline-none"
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, '')
              setUnits(Math.min(UNITS_MAX, Number(digits || 0)))
            }}
          />
          <span className="text-body-2 text-grey-700">단위</span>
        </label>
        <button
          type="button"
          aria-label="1단위 늘리기"
          disabled={units >= UNITS_MAX}
          className="shadow-card flex size-13 items-center justify-center rounded-full bg-white disabled:opacity-40"
          onClick={() => setUnits((value) => Math.min(UNITS_MAX, value + 1))}
        >
          <img src={iconPlus} alt="" width={20} height={20} />
        </button>
      </div>

      <p className="text-body-3 text-grey-800 rounded-key flex items-center gap-2 bg-yellow-50 px-3.5 py-3">
        <img src={iconInfo} alt="" width={16} height={16} />
        처방받은 단위와 같은지 한 번 더 확인해 주세요
      </p>

      <h3 className="text-grey-700 -mb-1 text-sm leading-normal font-bold">시각</h3>
      <div className="bg-grey-50 flex items-center gap-2.5 rounded-2xl px-4 py-3.5">
        <img src={iconClock} alt="" width={18} height={18} />
        <span className="text-body-2 text-grey-800 flex-1">{formatTakenAt(takenAt, now)}</span>
        <button
          type="button"
          className="text-grey-800 text-sm leading-normal font-bold"
          onClick={() => {
            const input = timeRef.current
            if (!input) return
            if (typeof input.showPicker === 'function') input.showPicker()
            else input.focus()
          }}
        >
          바꾸기
        </button>
        <input
          ref={timeRef}
          type="time"
          aria-label="맞은 시각"
          value={`${pad(takenAt.getHours())}:${pad(takenAt.getMinutes())}`}
          className="sr-only"
          onChange={(event) =>
            event.target.value && setTakenAt(withTime(takenAt, event.target.value))
          }
        />
      </div>

      <button
        type="button"
        disabled={!canSave}
        className="text-subtitle-1 bg-primary disabled:bg-grey-100 disabled:text-grey-400 h-14 rounded-xl leading-none text-white"
        onClick={() =>
          onSave({
            kind,
            name: kind === 'custom' ? name.trim() : undefined,
            units,
            takenAt: takenAt.toISOString(),
          })
        }
      >
        저장
      </button>
    </BottomSheet>
  )
}

export default InsulinSheet
