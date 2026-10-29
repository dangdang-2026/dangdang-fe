import iconRecords from '@/assets/icons/community/policy-compare.svg'
import iconAlert from '@/assets/icons/chat/suggest-alert.svg'
import iconInfo from '@/assets/icons/chat/suggest-info.svg'
import iconMemo from '@/assets/icons/chat/suggest-memo.svg'
import iconChevron from '@/assets/icons/postpartum/chevron-md.svg'
import ChatAvatar from '@/components/chat/ChatAvatar'
import { CHAT_SUGGESTIONS } from '@/constants/chat'

const SUGGESTION_ICON = { records: iconRecords, memo: iconMemo, info: iconInfo, alert: iconAlert }

type ChatIntroProps = {
  onAsk: (text: string) => void
}

// Figma Q-02 첫 화면: 소개 + 추천 질문
function ChatIntro({ onAsk }: ChatIntroProps) {
  return (
    <>
      <section className="flex flex-col gap-2.5 pt-3 pb-2">
        <ChatAvatar variant="hello" />
        <h2 className="text-t4 text-grey-900">진료 사이에 궁금한 걸 물어보세요</h2>
        <p className="text-grey-600 text-sm leading-relaxed">
          내 기록을 찾아 보여 드리고, 병원에 물어볼 말을 함께 정리해요. 몸 상태를 판단하거나
          처방하지는 않아요.
        </p>
      </section>
      <section className="flex flex-col gap-2 pt-2">
        <h3 className="text-body-3 text-grey-600">이렇게 물어보세요</h3>
        {CHAT_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.text}
            type="button"
            className="border-grey-200 rounded-key flex items-center gap-2.5 border py-3.5 pr-3.5 pl-4 text-left"
            onClick={() => onAsk(suggestion.text)}
          >
            <img src={SUGGESTION_ICON[suggestion.icon]} alt="" width={20} height={20} />
            <span className="text-body-2 text-grey-800 flex-1">{suggestion.text}</span>
            <img src={iconChevron} alt="" width={16} height={16} />
          </button>
        ))}
      </section>
    </>
  )
}

export default ChatIntro
