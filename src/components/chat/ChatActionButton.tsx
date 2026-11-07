import type { ReactNode } from 'react'

type ChatActionButtonProps = {
  icon?: string
  primary?: boolean
  href?: string
  onClick?: () => void
  children: ReactNode
}

// 말풍선·카드 아래 작은 버튼. href가 있으면 전화 링크
function ChatActionButton({
  icon,
  primary = false,
  href,
  onClick,
  children,
}: ChatActionButtonProps) {
  const className = `rounded-tag flex shrink-0 items-center gap-1.5 px-3.5 py-2.5 text-sm leading-snug font-bold ${
    primary ? 'bg-primary text-white' : 'bg-grey-100 text-grey-800'
  }`
  const content = (
    <>
      {icon && <img src={icon} alt="" width={16} height={16} />}
      {children}
    </>
  )

  return href ? (
    <a href={href} className={className}>
      {content}
    </a>
  ) : (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  )
}

export default ChatActionButton
