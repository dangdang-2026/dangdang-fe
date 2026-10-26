import { useState } from 'react'
import BottomSheet from '@/components/common/BottomSheet'

const MEMO_MAX_LENGTH = 100

type ContactMemoSheetProps = {
  initialMemo: string
  onSave: (memo: string) => void
  onClose: () => void
}

// M-03 연락 기준 메모 고치기
function ContactMemoSheet({ initialMemo, onSave, onClose }: ContactMemoSheetProps) {
  const [memo, setMemo] = useState(initialMemo)

  return (
    <BottomSheet label="연락 기준 메모" onClose={onClose}>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-t4 text-grey-900">연락 기준 메모</h2>
        <p className="text-t6 text-grey-700">언제 병원에 연락하라고 들었는지 적어 두세요.</p>
      </div>

      <label className="bg-grey-50 focus-within:border-primary flex flex-col gap-1 rounded-2xl border-2 border-transparent p-4 focus-within:bg-white">
        <textarea
          value={memo}
          rows={3}
          maxLength={MEMO_MAX_LENGTH}
          aria-label="연락 기준 메모"
          placeholder="예: 같은 시점에 계속 높게 나오면 외래로 전화하기"
          className="text-grey-900 placeholder:text-grey-400 resize-none bg-transparent text-base leading-normal font-medium outline-none"
          onChange={(event) => setMemo(event.target.value)}
        />
        <span className="text-grey-400 self-end text-xs leading-normal">
          {memo.length}/{MEMO_MAX_LENGTH}
        </span>
      </label>

      <button
        type="button"
        className="text-subtitle-1 bg-primary h-14 rounded-xl leading-none text-white"
        onClick={() => onSave(memo.trim())}
      >
        저장
      </button>
    </BottomSheet>
  )
}

export default ContactMemoSheet
