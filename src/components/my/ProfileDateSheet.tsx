import { useState } from 'react'
import BottomSheet from '@/components/common/BottomSheet'
import MonthCalendar from '@/components/visit/MonthCalendar'

type ProfileDateSheetProps = {
  title: string
  description: string
  initialDate: Date | null
  today: Date
  pick: 'future' | 'past'
  onSave: (date: Date) => void
  onClose: () => void
}

// M-02 출산예정일·진단일 고르기
function ProfileDateSheet({
  title,
  description,
  initialDate,
  today,
  pick,
  onSave,
  onClose,
}: ProfileDateSheetProps) {
  const [date, setDate] = useState(initialDate)

  return (
    <BottomSheet label={title} onClose={onClose}>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-t4 text-grey-900">{title}</h2>
        <p className="text-t6 text-grey-700">{description}</p>
      </div>

      <MonthCalendar selected={date} today={today} pick={pick} onSelect={setDate} />

      <button
        type="button"
        disabled={!date}
        className="text-subtitle-1 disabled:bg-grey-100 disabled:text-grey-400 bg-primary h-14 rounded-xl leading-none text-white"
        onClick={() => date && onSave(date)}
      >
        저장
      </button>
    </BottomSheet>
  )
}

export default ProfileDateSheet
