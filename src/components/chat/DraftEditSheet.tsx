import { useState } from 'react'
import BottomSheet from '@/components/common/BottomSheet'

const DRAFT_MAX_LENGTH = 300

type DraftEditSheetProps = {
  initialText: string
  onSave: (text: string) => void
  onClose: () => void
}

// Figma Q-09 물어볼 말 고치기
function DraftEditSheet({ initialText, onSave, onClose }: DraftEditSheetProps) {
  const [text, setText] = useState(initialText)

  return (
    <BottomSheet label="물어볼 말 고치기" onClose={onClose}>
      <h2 className="text-t4 text-grey-900">물어볼 말 고치기</h2>
      <textarea
        value={text}
        rows={4}
        maxLength={DRAFT_MAX_LENGTH}
        aria-label="물어볼 말"
        className="border-primary rounded-key text-t6 text-grey-900 resize-none border-2 px-4 py-3.5 leading-relaxed outline-none"
        onChange={(event) => setText(event.target.value)}
      />
      <button
        type="button"
        disabled={!text.trim()}
        className="bg-primary disabled:bg-grey-100 disabled:text-grey-400 rounded-key py-4 text-base leading-snug font-bold text-white"
        onClick={() => onSave(text.trim())}
      >
        고친 대로 추가
      </button>
    </BottomSheet>
  )
}

export default DraftEditSheet
