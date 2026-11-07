import type { ReactNode } from 'react'
import ChatAvatar, { type ChatAvatarVariant } from '@/components/chat/ChatAvatar'

type BotMessageProps = {
  avatar?: ChatAvatarVariant
  children: ReactNode
}

// Figma 「당당이 메시지」: 아바타 + 이름 + 말풍선·카드 묶음
function BotMessage({ avatar = 'agent', children }: BotMessageProps) {
  return (
    <div className="flex items-start gap-2">
      <ChatAvatar variant={avatar} />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <p className="text-grey-600 text-xs leading-snug font-medium">당당이</p>
        {children}
      </div>
    </div>
  )
}

export function BotBubble({ children }: { children: ReactNode }) {
  return (
    <p className="bg-grey-50 rounded-bubble text-t6 text-grey-800 rounded-tl-sm px-3.5 py-2.5">
      {children}
    </p>
  )
}

export function UserBubble({ text }: { text: string }) {
  return (
    <p className="rounded-bubble text-t6 text-grey-900 max-w-62.5 self-end rounded-tr-sm bg-yellow-100 px-3.5 py-2.5 break-words">
      {text}
    </p>
  )
}

export default BotMessage
