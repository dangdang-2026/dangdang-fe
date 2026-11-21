import { useState } from 'react'
import TimeWheelSheet from '@/components/common/TimeWheelSheet'
import { formatTime } from '@/utils/date'

const MINUTE_MS = 60 * 1000
const STEP_MS = 10 * MINUTE_MS
const DAY_MS = 24 * 60 * MINUTE_MS

type MeasuredTimePickerProps = {
  // 시트를 연 시각. 고를 수 있는 시각의 기준
  now: Date
  // 이보다 이른 시각은 못 고름. 식사 시작
  earliest: Date
  value: Date
  onChange: (measuredAt: Date) => void
}

// 지금 직전의 10분 단위 두 개. 예: 13:40이면 13:30 · 13:20
function getRecentTimes(now: Date) {
  const minute = Math.floor(now.getTime() / MINUTE_MS) * MINUTE_MS
  const floored = Math.floor(minute / STEP_MS) * STEP_MS
  const latest = floored === minute ? floored - STEP_MS : floored
  return [new Date(latest), new Date(latest - STEP_MS)]
}

// 'HH:MM'을 그 시각으로. 지금보다 뒤면 자정을 넘긴 어제 시각. 식사 시작 ~ 지금 안으로
function toMeasuredTime(time: string, earliest: Date) {
  const now = new Date()
  const [hours, minutes] = time.split(':').map(Number)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
  const picked = today > now ? new Date(today.getTime() - DAY_MS) : today
  return picked < earliest ? earliest : picked
}

// Figma G-07 늦게 잴 때 언제 쟀는지 고르기 · G-10 직접 고르기는 시간 시트로
function MeasuredTimePicker({ now, earliest, value, onChange }: MeasuredTimePickerProps) {
  const [wheelOpen, setWheelOpen] = useState(false)
  const presets = [now, ...getRecentTimes(now)]
  const custom = !presets.some((time) => time.getTime() === value.getTime())

  const option = (selected: boolean) =>
    `rounded-xl border px-4 py-3.5 text-left text-t6 text-grey-900 ${
      selected ? 'border-primary bg-yellow-50 font-bold' : 'border-transparent bg-white font-medium'
    }`

  return (
    <section className="bg-grey-50 flex flex-col gap-2 rounded-2xl p-4">
      <h3 className="text-t6 text-grey-900 font-bold">언제 재셨어요?</h3>
      <div role="radiogroup" aria-label="잰 시각" className="flex flex-col gap-2">
        {presets.map((time, index) => {
          const selected = time.getTime() === value.getTime()
          return (
            <button
              key={time.getTime()}
              type="button"
              role="radio"
              aria-checked={selected}
              className={option(selected)}
              onClick={() => onChange(time)}
            >
              {index === 0 ? `지금 · ${formatTime(time)}` : formatTime(time)}
            </button>
          )
        })}
        <button
          type="button"
          role="radio"
          aria-checked={custom}
          className={option(custom)}
          onClick={() => setWheelOpen(true)}
        >
          {custom ? `직접 고르기 · ${formatTime(value)}` : '직접 고르기'}
        </button>
      </div>
      <p className="text-grey-700 text-xs leading-normal font-medium">
        늦게 잰 기록은 리포트에 ‘늦게 잼’으로 표시돼요
      </p>
      {wheelOpen && (
        <TimeWheelSheet
          title="잰 시각"
          value={formatTime(value)}
          onDone={(time) => {
            onChange(toMeasuredTime(time, earliest))
            setWheelOpen(false)
          }}
          onClose={() => setWheelOpen(false)}
        />
      )}
    </section>
  )
}

export default MeasuredTimePicker
