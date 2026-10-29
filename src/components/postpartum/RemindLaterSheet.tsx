import { useState } from 'react'
import iconCheckDark from '@/assets/icons/check-dark.svg'
import BottomSheet from '@/components/common/BottomSheet'
import ProfileDateSheet from '@/components/my/ProfileDateSheet'
import { addDays, formatMonthDay, isSameDay, startOfDay } from '@/utils/date'

type RemindLaterSheetProps = {
  onConfirm: (date: Date) => void
  onClose: () => void
}

const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, date.getDate())

// Figma E-09 언제 다시 물어볼까요 · E-09b 날짜 고르기
function RemindLaterSheet({ onConfirm, onClose }: RemindLaterSheetProps) {
  const today = startOfDay(new Date())
  const presets = [
    { label: '1주 뒤', date: addDays(today, 7) },
    { label: '2주 뒤', date: addDays(today, 14) },
    { label: '한 달 뒤', date: addMonths(today, 1) },
  ]
  const [date, setDate] = useState(presets[1].date)
  const [picking, setPicking] = useState(false)

  const chipClass = (selected: boolean) =>
    `flex items-center gap-1 rounded-full border px-3.5 py-2 text-sm leading-snug ${
      selected
        ? 'bg-primary text-grey-900 border-transparent font-bold'
        : 'border-grey-200 text-grey-800 bg-white font-medium'
    }`

  return (
    <>
      <BottomSheet label="다시 물어볼 날" onClose={onClose}>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-t4 text-grey-900">언제 다시 물어볼까요?</h2>
          <p className="text-grey-600 text-sm leading-relaxed">
            아직 검사 날짜를 못 들었다면 괜찮아요. 그날 홈에서 다시 여쭤볼게요.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const selected = isSameDay(preset.date, date)
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={selected}
                className={chipClass(selected)}
                onClick={() => setDate(preset.date)}
              >
                {selected && <img src={iconCheckDark} alt="" width={14} height={14} />}
                {preset.label}
              </button>
            )
          })}
          <button type="button" className={chipClass(false)} onClick={() => setPicking(true)}>
            날짜 고르기
          </button>
        </div>

        <button
          type="button"
          className="bg-primary rounded-key py-4 text-base leading-snug font-bold text-white"
          onClick={() => onConfirm(date)}
        >
          {formatMonthDay(date)}에 다시 물어보기
        </button>
      </BottomSheet>

      {/* 시트 위에 달력 시트를 한 장 더 올림 */}
      {picking && (
        <ProfileDateSheet
          title="다시 물어볼 날"
          description="고른 날 아침, 홈에서 다시 여쭤볼게요."
          initialDate={date}
          today={today}
          pick="future"
          submitLabel={(day) => `${formatMonthDay(day)}에 다시 물어보기`}
          // 달력에서 고르면 바로 정함
          onSave={onConfirm}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  )
}

export default RemindLaterSheet
