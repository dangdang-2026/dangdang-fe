import { useState } from 'react'
import TimeWheelSheet from '@/components/common/TimeWheelSheet'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { formatAlarmTime } from '@/utils/criteria'

// 공복 알림은 5분 단위
const MINUTE_STEP = 5

type FastingTimeRowProps = {
  // 시각을 바꾸면. 예: 토스트
  onChanged?: (time: string) => void
}

// Figma A-02d·M-19 공복 알림 시각. 누르면 시간 휠 시트
function FastingTimeRow({ onChanged }: FastingTimeRowProps) {
  const fastingTime = useNotificationStore((state) => state.fastingTime)
  const setFastingTime = useNotificationStore((state) => state.setFastingTime)
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="bg-grey-50 flex w-full items-center gap-2 rounded-xl py-3 pr-3.5 pl-4 text-left text-sm leading-snug"
        onClick={() => setSheetOpen(true)}
      >
        <span className="text-grey-800 flex-1 font-medium">공복 알림</span>
        <span className="text-grey-900 font-bold">{formatAlarmTime(fastingTime)}</span>
        <span className="text-t7 text-grey-700 font-medium">바꾸기</span>
      </button>
      {sheetOpen && (
        <TimeWheelSheet
          title="공복 알림 시각"
          value={fastingTime}
          minuteStep={MINUTE_STEP}
          onDone={(time) => {
            setFastingTime(time)
            setSheetOpen(false)
            onChanged?.(time)
          }}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </>
  )
}

export default FastingTimeRow
