import { useState } from 'react'
import iconInfo from '@/assets/icons/info-md.svg'
import BottomSheet from '@/components/common/BottomSheet'

const QUESTION_MAX_LENGTH = 100

type QuestionSheetProps = {
  // 다음 진료일 칩. 모르면 없음
  visitLabel?: string
  onSave: (text: string) => void
  onClose: () => void
}

// Figma C-05 물어볼 것 적기
function QuestionSheet({ visitLabel, onSave, onClose }: QuestionSheetProps) {
  const [text, setText] = useState('')
  const trimmed = text.trim()

  return (
    <BottomSheet label="물어볼 것 적기" onClose={onClose}>
      <div className="flex items-center justify-between">
        <h2 className="text-t4 text-grey-900">물어볼 것 적기</h2>
        {visitLabel && (
          <span className="bg-grey-100 text-grey-600 rounded-full px-2.5 py-1 text-xs leading-normal font-bold">
            {visitLabel}
          </span>
        )}
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-t7 text-grey-700 font-bold">물어볼 것</span>
        <input
          autoFocus
          type="text"
          maxLength={QUESTION_MAX_LENGTH}
          placeholder="예: 식후 2시간으로 바꿔도 되나요?"
          value={text}
          className="bg-grey-50 focus:border-primary text-grey-900 placeholder:text-grey-400 h-14 rounded-2xl border-2 border-transparent px-4 text-base leading-normal font-medium outline-none focus:bg-white"
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && trimmed) onSave(trimmed)
          }}
        />
      </label>

      <p className="bg-grey-50 rounded-key flex items-center gap-2 px-3.5 py-3">
        <img src={iconInfo} alt="" width={16} height={16} />
        <span className="text-body-3 text-grey-700">진료 리포트 마지막에 함께 들어가요</span>
      </p>

      <button
        type="button"
        disabled={!trimmed}
        className="text-subtitle-1 disabled:bg-grey-100 disabled:text-grey-400 bg-primary h-14 rounded-xl leading-none text-white"
        onClick={() => onSave(trimmed)}
      >
        저장
      </button>
    </BottomSheet>
  )
}

export default QuestionSheet
