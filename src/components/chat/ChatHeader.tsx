import iconBack from '@/assets/icons/chat/back.svg'
import iconHelp from '@/assets/icons/chat/help.svg'
import ChatAvatar from '@/components/chat/ChatAvatar'

type ChatHeaderProps = {
  onBack: () => void
  onHelp: () => void
}

// Figma Q-02 머리: 뒤로 · 당당이 · 도움말
function ChatHeader({ onBack, onHelp }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white pt-12.5">
      <div className="border-grey-100 flex h-14 items-center justify-between border-b px-4">
        <button type="button" aria-label="뒤로" onClick={onBack}>
          <img src={iconBack} alt="" width={24} height={24} />
        </button>
        <h1 className="text-subtitle-1 text-grey-900 flex items-center gap-2">
          <ChatAvatar variant="header" />
          당당이
        </h1>
        <button type="button" aria-label="기록 보기 동의 다시 보기" onClick={onHelp}>
          <img src={iconHelp} alt="" width={22} height={22} />
        </button>
      </div>
    </header>
  )
}

export default ChatHeader
