import { useState } from 'react'
import iconClockDark from '@/assets/icons/clock-dark.svg'
import iconHospital from '@/assets/icons/hospital.svg'
import BottomSheet from '@/components/common/BottomSheet'
import TimeWheelSheet from '@/components/common/TimeWheelSheet'
import MonthCalendar from '@/components/visit/MonthCalendar'
import { usePrimaryHospital } from '@/hooks/usePrimaryHospital'
import { formatMeridiemTime, formatTime, startOfDay } from '@/utils/date'

// 시각을 정하지 않았을 때 기본 진료 시각
const DEFAULT_TIME = '10:30'

type VisitDateSheetProps = {
  // 처음 묻기(C-01) / 고치기(C-18)
  editing?: boolean
  // 다른 병원 진료일을 고를 때. 없으면 대표 병원
  hospitalName?: string
  initialAt: Date | null
  today: Date
  onSave: (at: Date) => void
  onUnknown: () => void
  onClose: () => void
}

// Figma C-01·C-18 다음 진료일 고르기
function VisitDateSheet({
  editing,
  hospitalName,
  initialAt,
  today,
  onSave,
  onUnknown,
  onClose,
}: VisitDateSheetProps) {
  const hospital = usePrimaryHospital()
  const [date, setDate] = useState<Date | null>(initialAt ? startOfDay(initialAt) : null)
  const [time, setTime] = useState(initialAt ? formatTime(initialAt) : DEFAULT_TIME)
  const [timeSheet, setTimeSheet] = useState(false)

  const [hours, minutes] = time.split(':').map(Number)
  const timeLabel = formatMeridiemTime(new Date(2000, 0, 1, hours, minutes))

  const handleSave = () => {
    if (!date) return
    const at = new Date(date)
    at.setHours(hours, minutes)
    onSave(at)
  }

  return (
    <BottomSheet label="다음 진료일" onClose={onClose}>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-t4 text-grey-900">
          {editing ? '다음 진료일 고치기' : '다음 진료가 언제예요?'}
        </h2>
        <p className="text-t6 text-grey-700">
          {editing
            ? '바뀐 날짜를 골라 주세요. 지난 기록과 리포트는 그대로예요.'
            : '병원에서 안내받은 날짜를 적어 주세요.'}
        </p>
      </div>

      <MonthCalendar selected={date} today={today} onSelect={setDate} />

      <div className="flex gap-2">
        <button
          type="button"
          className="text-grey-800 flex items-center gap-1 rounded-full bg-yellow-50 px-3.5 py-2 text-sm leading-normal font-bold"
          onClick={() => setTimeSheet(true)}
        >
          <img src={iconClockDark} alt="" width={14} height={14} />
          {timeLabel}
        </button>
        {/* 병원 등록 연동 전이라 표시만 */}
        <span className="bg-grey-100 text-grey-700 flex items-center gap-1 rounded-full px-3.5 py-2 text-sm leading-normal font-bold">
          <img src={iconHospital} alt="" width={14} height={14} />
          {hospitalName ?? hospital.name}
        </span>
      </div>

      <button
        type="button"
        disabled={!date}
        className="text-subtitle-1 disabled:bg-grey-100 disabled:text-grey-400 bg-primary h-14 rounded-xl leading-none text-white"
        onClick={handleSave}
      >
        저장
      </button>
      <button
        type="button"
        className="text-subtitle-1 bg-grey-100 text-grey-700 h-14 rounded-xl leading-none"
        onClick={onUnknown}
      >
        아직 몰라요 · 나중에 적을게요
      </button>

      {timeSheet && (
        <TimeWheelSheet
          title="진료 시각"
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

export default VisitDateSheet
