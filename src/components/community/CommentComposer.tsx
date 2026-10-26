import { useState } from 'react'
import iconClose from '@/assets/icons/close.svg'

const COMMENT_MAX_LENGTH = 300

type CommentComposerProps = {
  // 예: 익명 산모님께 답글. 없으면 글에 댓글
  replyTo: string | null
  nickname: string
  onSubmit: (body: string) => void
  onClose: () => void
}

// Figma U-18 댓글 쓰는 중. 하단 바 자리에 고정
function CommentComposer({ replyTo, nickname, onSubmit, onClose }: CommentComposerProps) {
  const [body, setBody] = useState('')
  const trimmed = body.trim()

  return (
    <div className="border-grey-100 fixed bottom-0 left-1/2 z-40 w-full max-w-107.5 -translate-x-1/2 border-t bg-white px-4 pt-2.5 pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between pb-2">
        <p className="text-grey-500 text-xs leading-snug">
          {replyTo ? `${replyTo}님께 답글` : '댓글'} · {nickname}로 남겨요
        </p>
        <button type="button" aria-label="댓글 쓰기 닫기" onClick={onClose}>
          <img src={iconClose} alt="" width={16} height={16} />
        </button>
      </div>
      <div className="border-primary flex items-end gap-2 rounded-2xl border-2 py-2 pr-2 pl-4">
        <textarea
          // 열리면 바로 쓰기
          autoFocus
          value={body}
          rows={2}
          maxLength={COMMENT_MAX_LENGTH}
          aria-label={replyTo ? '답글' : '댓글'}
          placeholder="따뜻한 한마디를 남겨 주세요"
          className="text-t6 text-grey-900 placeholder:text-grey-400 min-w-0 flex-1 resize-none py-1 outline-none"
          onChange={(event) => setBody(event.target.value)}
        />
        <button
          type="button"
          disabled={!trimmed}
          className="bg-primary text-grey-900 disabled:bg-grey-100 disabled:text-grey-400 shrink-0 rounded-full px-3.5 py-2 text-sm leading-snug font-bold"
          onClick={() => onSubmit(trimmed)}
        >
          등록
        </button>
      </div>
    </div>
  )
}

export default CommentComposer
