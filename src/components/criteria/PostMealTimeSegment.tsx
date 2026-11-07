import { useState } from 'react'
import PostMealTimeSheet from '@/components/criteria/PostMealTimeSheet'
import { POST_MEAL_PRESETS } from '@/constants/criteria'
import { formatDuration } from '@/utils/criteria'

type PostMealTimeSegmentProps = {
  value: number | null
  onChange: (hours: number) => void
}

const segmentClass = (selected: boolean) =>
  `text-t6 flex-1 rounded-xl py-3 font-bold ${
    selected ? 'shadow-segment text-grey-900 bg-white' : 'text-grey-500'
  }`

// Figma M-03·C-09 측정 시점: 식후 1시간 · 2시간 · 직접 입력
function PostMealTimeSegment({ value, onChange }: PostMealTimeSegmentProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const custom = value !== null && !POST_MEAL_PRESETS.includes(value)

  return (
    <>
      <div className="bg-grey-100 flex gap-1 rounded-2xl p-1">
        {POST_MEAL_PRESETS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            className={segmentClass(value === option)}
            onClick={() => onChange(option)}
          >
            식후 {formatDuration(option)}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={custom}
          className={segmentClass(custom)}
          onClick={() => setSheetOpen(true)}
        >
          {custom ? formatDuration(value) : '직접 입력'}
        </button>
      </div>
      {sheetOpen && (
        <PostMealTimeSheet
          value={custom ? value : null}
          onDone={(hours) => {
            onChange(hours)
            setSheetOpen(false)
          }}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </>
  )
}

export default PostMealTimeSegment
