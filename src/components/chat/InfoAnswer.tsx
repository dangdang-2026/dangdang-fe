import iconSource from '@/assets/icons/info-sm.svg'
import iconArrow from '@/assets/icons/chat/source-arrow.svg'
import { BotBubble } from '@/components/chat/BotMessage'
import type { ChatInfo } from '@/types/chat'

type InfoAnswerProps = {
  info: ChatInfo
  feedback: 'yes' | 'no' | null
  onFeedback: (feedback: 'yes' | 'no') => void
}

// Figma Q-06 일반 정보: 답 + 출처 + 도움 됐는지
function InfoAnswer({ info, feedback, onFeedback }: InfoAnswerProps) {
  const pill = 'border-grey-200 text-body-3 text-grey-700 rounded-full border px-3 py-1.5'

  return (
    <>
      <BotBubble>{info.answer}</BotBubble>
      <a
        href={info.source.url}
        target="_blank"
        rel="noreferrer"
        className="border-grey-200 rounded-tag flex items-center gap-1.5 border py-2 pr-2.5 pl-3"
      >
        <img src={iconSource} alt="" width={14} height={14} />
        <span className="text-grey-600 text-xs leading-snug font-medium">
          출처 · {info.source.label}
        </span>
        <img src={iconArrow} alt="" width={12} height={12} />
      </a>
      {info.followUp && <BotBubble>{info.followUp}</BotBubble>}
      {feedback ? (
        <p className="text-t7 text-grey-600">알려 주셔서 고마워요</p>
      ) : (
        <div className="flex items-center gap-2.5">
          <p className="text-t7 text-grey-600">답변이 도움이 됐나요?</p>
          <button type="button" className={pill} onClick={() => onFeedback('yes')}>
            네
          </button>
          <button type="button" className={pill} onClick={() => onFeedback('no')}>
            아니요
          </button>
        </div>
      )}
    </>
  )
}

export default InfoAnswer
