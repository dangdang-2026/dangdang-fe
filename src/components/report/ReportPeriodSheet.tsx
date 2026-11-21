import { useState } from 'react'
import { createPortal } from 'react-dom'
import iconClose from '@/assets/icons/close.svg'
import BottomSheet from '@/components/common/BottomSheet'
import FoodChip from '@/components/meal/FoodChip'
import RangeSheet from '@/components/stats/RangeSheet'
import { REPORT_DAYS } from '@/constants/report'
import { usePrimaryHospital } from '@/hooks/usePrimaryHospital'
import { useCriteriaStore } from '@/stores/useCriteriaStore'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { useHospitalStore } from '@/stores/useHospitalStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { countCriteriaChanges } from '@/utils/criteria'
import { addDays, diffInDays, formatMonthDay, parseDateKey, startOfDay } from '@/utils/date'
import { formatPregnancyRange, FULL_TERM_DAYS } from '@/utils/pregnancy'
import { formatRangeLabel, type DateRange } from '@/utils/stats'

type Preset = 'recent' | 'month' | 'pregnancy' | 'custom'

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'recent', label: '지난 2주' },
  { key: 'month', label: '이번 달' },
  { key: 'pregnancy', label: '임신 중 전체' },
  { key: 'custom', label: '직접 고르기' },
]

const DAYS_IN_YEAR = 365

type ReportPeriodSheetProps = {
  today: Date
  onCreate: (range: DateRange, hospital: string) => void
  onClose: () => void
}

// Figma C-25 기간 골라 리포트 만들기 · C-25b 직접 고르기는 달력 시트
function ReportPeriodSheet({ today, onCreate, onClose }: ReportPeriodSheetProps) {
  const primary = usePrimaryHospital()
  const hospitals = useHospitalStore((state) => state.hospitals)
  const records = useGlucoseStore((state) => state.records)
  const versions = useCriteriaStore((state) => state.versions)
  const dueDate = useProfileStore((state) => state.dueDate)
  const [preset, setPreset] = useState<Preset>('recent')
  const [custom, setCustom] = useState<DateRange | null>(null)
  const [rangeOpen, setRangeOpen] = useState(false)
  // 다니는 병원 이름(겹치는 이름은 하나로). 하나도 없으면 대표 병원 이름
  const hospitalNames = hospitals.length
    ? [...new Set(hospitals.map((item) => item.name))]
    : [primary.name]
  // 고른 병원이 목록에 없으면(늦게 받아 옴 · 지움) 첫 병원
  const [picked, setHospital] = useState<string | null>(null)
  const hospital = picked && hospitalNames.includes(picked) ? picked : hospitalNames[0]

  // 가장 오래된 기록 날짜. 없으면 오늘
  const firstRecordDay = records.reduce((earliest, record) => {
    const day = startOfDay(new Date(record.measuredAt))
    return day < earliest ? day : earliest
  }, today)
  // 임신 시작일(예정일 280일 전)부터. 그보다 늦게 기록을 시작했으면 첫 기록부터
  const due = parseDateKey(dueDate)
  const pregnancyStart = due ? addDays(due, -FULL_TERM_DAYS) : null
  const pregnancyFrom =
    pregnancyStart && pregnancyStart > firstRecordDay ? pregnancyStart : firstRecordDay
  // 직접 고르기는 임신 시작일 · 첫 기록 중 이른 날부터. 둘 다 없으면 1년 전부터
  const earliest =
    pregnancyStart && pregnancyStart < firstRecordDay ? pregnancyStart : firstRecordDay
  const pickStart = earliest < today ? earliest : addDays(today, -DAYS_IN_YEAR)

  const range: DateRange | null = (() => {
    if (preset === 'month')
      return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: today }
    if (preset === 'pregnancy') return { from: pregnancyFrom, to: today }
    if (preset === 'custom') return custom
    return { from: addDays(today, -(REPORT_DAYS - 1)), to: today }
  })()

  const measured = range
    ? records.filter((record) => {
        const at = new Date(record.measuredAt)
        return at >= range.from && at < addDays(range.to, 1)
      }).length
    : 0
  const changes = range ? countCriteriaChanges(versions, range.from, range.to) : 0
  const pregnancy = range ? formatPregnancyRange(dueDate, range.from, range.to) : null

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
              // 직접 고르기는 달력에서 고른 뒤에 선택됨
              onClick={() => (key === 'custom' ? setRangeOpen(true) : setPreset(key))}
            />
          ))}
        </div>
      </section>

      {range && (
        <div className="bg-grey-50 rounded-key flex flex-col gap-1 px-4 py-3.5">
          <p className="text-t6 text-grey-900 font-bold">
            {formatMonthDay(range.from)} – {formatMonthDay(range.to)}
            {pregnancy && ` · ${pregnancy}`}
          </p>
          <p className="text-t7 text-grey-700">
            측정 {measured}
            {changes > 0 && ` · 기준 ${changes}번 바뀜`} · {hospital}
          </p>
        </div>
      )}

      {/* 병원이 둘 이상일 때만 고름 */}
      {hospitalNames.length > 1 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-body-3 text-grey-600">어느 병원에 보여 줄까요</h3>
          <div className="flex flex-wrap gap-2">
            {hospitalNames.map((name) => (
              <FoodChip
                key={name}
                name={name}
                selected={hospital === name}
                onClick={() => setHospital(name)}
              />
            ))}
          </div>
        </section>
      )}

      <p className="bg-grey-50 text-grey-700 text-t7 rounded-xl px-3.5 py-3 leading-relaxed">
        기간 안에 기준이 바뀌었으면 기록마다 그때 기준으로 세어요. 평균이나 그래프 없이 기록만
        담아요.
      </p>

      <button
        type="button"
        disabled={!range}
        className="text-subtitle-1 disabled:bg-grey-100 disabled:text-grey-400 bg-primary h-14 rounded-xl leading-none text-white"
        onClick={() => range && onCreate(range, hospital)}
      >
        이 기간으로 만들기
      </button>

      {/* 기간 시트 안에서 열어도 화면 기준으로 뜨게 body로 */}
      {rangeOpen &&
        createPortal(
          <RangeSheet
            title="리포트 기간"
            actionLabel={(picked) =>
              `${formatRangeLabel(picked)} · ${diffInDays(picked.from, picked.to) + 1}일 동안`
            }
            today={today}
            start={pickStart}
            initial={custom}
            onApply={(picked) => {
              setCustom(picked)
              setPreset('custom')
              setRangeOpen(false)
            }}
            onClose={() => setRangeOpen(false)}
          />,
          document.body,
        )}
    </BottomSheet>
  )
}

export default ReportPeriodSheet
