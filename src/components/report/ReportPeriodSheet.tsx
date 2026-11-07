import { useState } from 'react'
import iconClose from '@/assets/icons/close.svg'
import iconInfo from '@/assets/icons/info-lg.svg'
import BottomSheet from '@/components/common/BottomSheet'
import FoodChip from '@/components/meal/FoodChip'
import { REPORT_DAYS } from '@/constants/report'
import { usePrimaryHospital } from '@/hooks/usePrimaryHospital'
import { useCriteriaStore } from '@/stores/useCriteriaStore'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { countCriteriaChanges } from '@/utils/criteria'
import { addDays, formatMonthDay, parseDateKey, startOfDay, toDateKey } from '@/utils/date'

type Preset = 'recent' | 'month' | 'all' | 'custom'

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'recent', label: '지난 2주' },
  { key: 'month', label: '이번 달' },
  { key: 'all', label: '전체 기록' },
  { key: 'custom', label: '직접 고르기' },
]

type ReportPeriodSheetProps = {
  today: Date
  onCreate: (from: Date, to: Date) => void
  onClose: () => void
}

// Figma C-25 기간 골라 리포트 만들기
function ReportPeriodSheet({ today, onCreate, onClose }: ReportPeriodSheetProps) {
  const hospital = usePrimaryHospital()
  const records = useGlucoseStore((state) => state.records)
  const versions = useCriteriaStore((state) => state.versions)
  const [preset, setPreset] = useState<Preset>('recent')
  const [customFrom, setCustomFrom] = useState(toDateKey(addDays(today, -(REPORT_DAYS - 1))))
  const [customTo, setCustomTo] = useState(toDateKey(today))

  // 가장 오래된 기록 날짜. 없으면 오늘
  const firstRecordDay = records.reduce((earliest, record) => {
    const day = startOfDay(new Date(record.measuredAt))
    return day < earliest ? day : earliest
  }, today)

  const range = (() => {
    if (preset === 'month')
      return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: today }
    if (preset === 'all') return { from: firstRecordDay, to: today }
    if (preset === 'custom') {
      const from = parseDateKey(customFrom)
      const to = parseDateKey(customTo)
      return from && to && from <= to ? { from, to } : null
    }
    return { from: addDays(today, -(REPORT_DAYS - 1)), to: today }
  })()

  const measured = range
    ? records.filter((record) => {
        const at = new Date(record.measuredAt)
        return at >= range.from && at < addDays(range.to, 1)
      }).length
    : 0
  const changes = range ? countCriteriaChanges(versions, range.from, range.to) : 0

  return (
    <BottomSheet label="리포트 기간 고르기" onClose={onClose}>
      <div className="flex items-center justify-between">
        <h2 className="text-t4 text-grey-900">어느 기간을 볼까요?</h2>
        <button type="button" aria-label="닫기" onClick={onClose}>
          <img src={iconClose} alt="" width={22} height={22} />
        </button>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-body-3 text-grey-600">기간</h3>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(({ key, label }) => (
            <FoodChip
              key={key}
              name={label}
              selected={preset === key}
              onClick={() => setPreset(key)}
            />
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              aria-label="시작 날짜"
              max={customTo}
              value={customFrom}
              className="bg-grey-50 text-grey-900 rounded-key min-w-0 flex-1 px-3 py-2.5 text-sm"
              onChange={(event) => setCustomFrom(event.target.value)}
            />
            <span className="text-grey-500">–</span>
            <input
              type="date"
              aria-label="끝 날짜"
              min={customFrom}
              max={toDateKey(today)}
              value={customTo}
              className="bg-grey-50 text-grey-900 rounded-key min-w-0 flex-1 px-3 py-2.5 text-sm"
              onChange={(event) => setCustomTo(event.target.value)}
            />
          </div>
        )}
      </section>

      {range && (
        <div className="bg-grey-50 rounded-key flex flex-col gap-1 px-4 py-3.5">
          <p className="text-grey-900 text-sm leading-normal font-bold">
            {formatMonthDay(range.from)} – {formatMonthDay(range.to)}
          </p>
          <p className="text-grey-500 text-xs leading-normal">
            측정 {measured}
            {changes > 0 && ` · 기준 ${changes}번 바뀜`} · {hospital.name}
          </p>
        </div>
      )}

      <p className="bg-grey-50 flex gap-2 rounded-xl px-3.5 py-3">
        <img src={iconInfo} alt="" width={18} height={18} className="self-start" />
        <span className="text-grey-700 text-t7 flex-1 leading-relaxed">
          기간 안에 기준이 바뀌었으면 기록마다 그때 기준으로 세어요. 평균이나 그래프 없이 기록만
          담아요.
        </span>
      </p>

      <button
        type="button"
        disabled={!range}
        className="text-subtitle-1 disabled:bg-grey-100 disabled:text-grey-400 bg-primary h-14 rounded-xl leading-none text-white"
        onClick={() => range && onCreate(range.from, range.to)}
      >
        이 기간으로 만들기
      </button>
    </BottomSheet>
  )
}

export default ReportPeriodSheet
