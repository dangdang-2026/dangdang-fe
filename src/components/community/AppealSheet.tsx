import { useState } from 'react'
import BottomSheet from '@/components/common/BottomSheet'
import { sendAppeal } from '@/stores/useCommunityStore'

const APPEAL_MAX_LENGTH = 1000

const DONE_MESSAGE = {
  sent: '이의 신청을 보냈어요. 운영자가 살펴볼게요',
  already: '이미 이의 신청을 했어요',
  lifted: '지금은 이용 제한 중이 아니에요',
} as const

export type AppealResult = keyof typeof DONE_MESSAGE

type AppealSheetProps = {
  // 끝나면 알릴 문구와 결과. lifted면 제한이 풀려 제한 시트로 돌아가지 않음
  onDone: (message: string, result: AppealResult) => void
  onClose: () => void
}

// 이용 제한 이의 신청. 피그마에 화면이 없어 기존 시트 모양으로
function AppealSheet({ onDone, onClose }: AppealSheetProps) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)
  const trimmed = content.trim()

  const submit = () => {
    if (!trimmed || sending) return
    setSending(true)
    setFailed(false)
    sendAppeal(trimmed)
      .then((result) => onDone(DONE_MESSAGE[result], result))
      .catch(() => {
        setFailed(true)
        setSending(false)
      })
  }

  return (
    <BottomSheet label="이의 신청" onClose={onClose}>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-t4 text-grey-900">이의 신청</h2>
        <p className="text-t6 text-grey-700">어떤 점이 억울했는지 적어 주세요.</p>
      </div>

      <label className="bg-grey-50 focus-within:border-primary flex flex-col gap-1 rounded-2xl border-2 border-transparent p-4 focus-within:bg-white">
        <textarea
          autoFocus
          value={content}
          rows={5}
          maxLength={APPEAL_MAX_LENGTH}
          aria-label="이의 내용"
          placeholder="예: 약 이름을 쓴 건 제 경험을 나누려던 거예요."
          className="text-grey-900 placeholder:text-grey-400 resize-none bg-transparent text-base leading-normal font-medium outline-none"
          onChange={(event) => setContent(event.target.value)}
        />
        <span className="text-grey-400 self-end text-xs leading-normal">
          {content.length}/{APPEAL_MAX_LENGTH}
        </span>
      </label>

      {failed && (
        <p role="alert" className="text-t7 text-red-500">
          보내지 못했어요. 잠시 후 다시 시도해 주세요
        </p>
      )}

      <button
        type="button"
        disabled={!trimmed || sending}
        className="text-subtitle-1 disabled:bg-grey-100 disabled:text-grey-400 bg-primary h-14 rounded-xl leading-none text-white"
        onClick={submit}
      >
        {sending ? '보내는 중이에요' : '보내기'}
      </button>
    </BottomSheet>
  )
}

export default AppealSheet
