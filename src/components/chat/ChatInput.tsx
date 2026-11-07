import { useState, type FormEvent } from 'react'
import iconSend from '@/assets/icons/chat/send.svg'

const QUESTION_MAX_LENGTH = 200

type ChatInputProps = {
  disabled: boolean
  onSend: (text: string) => void
}

// Figma Q-02 입력 바 + 진단·처방 안 함 안내
function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [text, setText] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const question = text.trim()
    if (!question || disabled) return
    onSend(question)
    setText('')
  }

  return (
    <form
      className="border-grey-100 sticky bottom-0 flex flex-col items-center gap-1.5 border-t bg-white px-5 pt-2.5 pb-[max(--spacing(4.5),env(safe-area-inset-bottom))]"
      onSubmit={handleSubmit}
    >
      <div className="bg-grey-50 focus-within:ring-primary flex w-full items-center gap-2 rounded-full py-1.5 pr-1.5 pl-4.5 focus-within:ring-2">
        <input
          value={text}
          maxLength={QUESTION_MAX_LENGTH}
          aria-label="질문"
          placeholder="당당이에게 물어보세요"
          className="text-t6 text-grey-900 placeholder:text-grey-700 min-w-0 flex-1 bg-transparent outline-none"
          onChange={(event) => setText(event.target.value)}
        />
        <button
          type="submit"
          aria-label="보내기"
          disabled={disabled}
          className="bg-primary flex size-9 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
        >
          <img src={iconSend} alt="" width={18} height={18} />
        </button>
      </div>
      <p className="text-caption text-grey-600 leading-snug font-normal">
        당당이는 진단·처방을 하지 않아요. 몸이 이상하면 병원에 먼저 연락하세요.
      </p>
    </form>
  )
}

export default ChatInput
