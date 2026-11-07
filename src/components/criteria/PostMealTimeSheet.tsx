import { useState } from 'react'
import BottomSheet from '@/components/common/BottomSheet'
import { WheelColumn } from '@/components/common/TimeWheelSheet'
import {
  POST_MEAL_MAX_MINUTES,
  POST_MEAL_MIN_MINUTES,
  POST_MEAL_STEP_MINUTES,
} from '@/constants/criteria'

const HOURS = Array.from({ length: POST_MEAL_MAX_MINUTES / 60 + 1 }, (_, index) => `${index}시간`)
const MINUTES = Array.from(
  { length: 60 / POST_MEAL_STEP_MINUTES },
  (_, index) => `${index * POST_MEAL_STEP_MINUTES}분`,
)

type PostMealTimeSheetProps = {
  // 시간(소수 가능). 없으면 1시간 30분부터
  value: number | null
  onDone: (hours: number) => void
  onClose: () => void
}

// Figma A-02e 식후 측정 시간 직접 입력. 30분~3시간, 10분 단위
function PostMealTimeSheet({ value, onDone, onClose }: PostMealTimeSheetProps) {
  const total = Math.round((value ?? 1.5) * 60)
  const initial = {
    hour: Math.floor(total / 60),
    minute: Math.round((total % 60) / POST_MEAL_STEP_MINUTES),
  }
  const [hour, setHour] = useState(initial.hour)
  const [minute, setMinute] = useState(initial.minute)

  const done = () => {
    const minutes = hour * 60 + minute * POST_MEAL_STEP_MINUTES
    const clamped = Math.min(POST_MEAL_MAX_MINUTES, Math.max(POST_MEAL_MIN_MINUTES, minutes))
    onDone(clamped / 60)
  }

  return (
    <BottomSheet label="식후 측정 시간" onClose={onClose}>
      <h2 className="text-grey-900 text-lg leading-normal font-bold">
        식사 시작 후 몇 분 뒤에 재나요?
      </h2>
      <div className="flex justify-center gap-3">
        <WheelColumn label="시간" items={HOURS} initialIndex={initial.hour} onChange={setHour} />
        <WheelColumn
          label="분"
          items={MINUTES}
          initialIndex={initial.minute}
          onChange={setMinute}
        />
      </div>
      <p className="text-grey-600 text-center text-xs leading-normal">
        30분~3시간, 10분 단위로 골라요
      </p>
      <button
        type="button"
        className="text-subtitle-1 bg-primary h-14 rounded-xl leading-none text-white"
        onClick={done}
      >
        이 시간으로 할게요
      </button>
    </BottomSheet>
  )
}

export default PostMealTimeSheet
