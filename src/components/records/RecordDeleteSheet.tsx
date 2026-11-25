import ConfirmSheet from '@/components/common/ConfirmSheet'
import type { GlucoseRecord } from '@/types/glucose'
import { formatMonthDay, formatTime } from '@/utils/date'

type RecordDeleteSheetProps = {
  record: GlucoseRecord
  // 예: 아침 식후 1시간
  label: string
  onConfirm: () => void
  onClose: () => void
}

// Figma D-11 기록 삭제 확인. 지우는 기록을 보여 주고 빨간 버튼. 5초 되돌리기는 서버 API가 나오면
function RecordDeleteSheet({ record, label, onConfirm, onClose }: RecordDeleteSheetProps) {
  const measuredAt = new Date(record.measuredAt)
  return (
    <ConfirmSheet
      title="이 기록을 지울까요?"
      detail={
        <div className="flex flex-col gap-1">
          <p className="text-grey-700 text-sm font-medium">
            {formatMonthDay(measuredAt)} {formatTime(measuredAt)} · {label}
          </p>
          <p className="flex items-baseline gap-0.5">
            <span className="text-title-3 text-grey-900 font-bold">{record.value}</span>
            <span className="text-t7 text-grey-600 font-medium">mg/dL</span>
          </p>
        </div>
      }
      description="지운 기록은 진료 리포트에서도 빠져요."
      confirmLabel="지우기"
      danger
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}

export default RecordDeleteSheet
