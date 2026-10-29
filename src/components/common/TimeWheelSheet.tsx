import { useLayoutEffect, useRef, useState } from 'react'
import BottomSheet from '@/components/common/BottomSheet'

// 한 줄 높이(h-10)
const ROW_PX = 40

const MERIDIEMS = ['오전', '오후']
// 12시를 맨 앞에 둬서 순서 = 0시부터
const HOURS = ['12', ...Array.from({ length: 11 }, (_, index) => String(index + 1))]
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))

type WheelColumnProps = {
  label: string
  items: string[]
  initialIndex: number
  onChange: (index: number) => void
}

// 위아래로 밀어서 고르는 한 칸. 가운데 줄이 고른 값
function WheelColumn({ label, items, initialIndex, onChange }: WheelColumnProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(initialIndex)

  useLayoutEffect(() => {
    if (listRef.current) listRef.current.scrollTop = initialIndex * ROW_PX
  }, [initialIndex])

  const handleScroll = () => {
    const list = listRef.current
    if (!list) return
    const next = Math.min(items.length - 1, Math.max(0, Math.round(list.scrollTop / ROW_PX)))
    if (next === active) return
    setActive(next)
    onChange(next)
  }

  return (
    <div className="relative h-50 w-21">
      <span className="bg-grey-100 absolute inset-x-0 top-19 h-12 rounded-xl" />
      <div
        ref={listRef}
        role="listbox"
        aria-label={label}
        className="relative h-full snap-y snap-mandatory [scrollbar-width:none] overflow-y-auto py-20"
        onScroll={handleScroll}
      >
        {items.map((item, index) => {
          const distance = Math.abs(index - active)
          return (
            <button
              key={item}
              type="button"
              role="option"
              aria-selected={distance === 0}
              className={`flex h-10 w-full snap-center items-center justify-center ${
                distance === 0
                  ? 'text-grey-900 text-xl font-medium'
                  : distance === 1
                    ? 'text-grey-400 text-lg'
                    : 'text-grey-300 text-sm'
              }`}
              onClick={() => listRef.current?.scrollTo({ top: index * ROW_PX, behavior: 'smooth' })}
            >
              {item}
            </button>
          )
        })}
      </div>
    </div>
  )
}

type TimeWheelSheetProps = {
  title: string
  // 'HH:MM' 24시간
  value: string
  onDone: (value: string) => void
  onClose: () => void
}

// Figma D-16 시간 시트: 오전·오후 · 시 · 분 휠
function TimeWheelSheet({ title, value, onDone, onClose }: TimeWheelSheetProps) {
  // 처음 값. 휠을 밀어도 스크롤 위치를 다시 맞추지 않게 따로 둠
  const [hours, minutes] = value.split(':').map(Number)
  const initial = { meridiem: hours >= 12 ? 1 : 0, hour: hours % 12, minute: minutes }
  const [meridiem, setMeridiem] = useState(initial.meridiem)
  const [hour, setHour] = useState(initial.hour)
  const [minute, setMinute] = useState(initial.minute)

  const pad = (number: number) => String(number).padStart(2, '0')

  return (
    <BottomSheet label={title} onClose={onClose}>
      <h2 className="text-grey-900 text-lg leading-normal font-bold">{title}</h2>
      <div className="flex justify-center gap-3">
        <WheelColumn
          label="오전 오후"
          items={MERIDIEMS}
          initialIndex={initial.meridiem}
          onChange={setMeridiem}
        />
        <WheelColumn label="시" items={HOURS} initialIndex={initial.hour} onChange={setHour} />
        <WheelColumn
          label="분"
          items={MINUTES}
          initialIndex={initial.minute}
          onChange={setMinute}
        />
      </div>
      <button
        type="button"
        className="text-subtitle-1 bg-primary mt-1.5 h-14 rounded-xl leading-none text-white"
        onClick={() => onDone(`${pad(meridiem * 12 + hour)}:${pad(minute)}`)}
      >
        완료
      </button>
    </BottomSheet>
  )
}

export default TimeWheelSheet
