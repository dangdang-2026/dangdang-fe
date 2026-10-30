import agentFace28 from '@/assets/images/chat/agent-28.svg'
import agentFace32 from '@/assets/images/chat/agent-32.svg'
import body28 from '@/assets/images/chat/body-28.svg'
import body32 from '@/assets/images/chat/body-32.svg'
import body44 from '@/assets/images/chat/body-44.svg'
import body56 from '@/assets/images/chat/body-56.svg'
import doneFace32 from '@/assets/images/chat/done-32.svg'
import helloFace56 from '@/assets/images/chat/hello-56.svg'
import sorryFace32 from '@/assets/images/chat/sorry-32.svg'
import sorryFace56 from '@/assets/images/chat/sorry-56.svg'
import thinkFace32 from '@/assets/images/chat/think-32.svg'
import thinkFace44 from '@/assets/images/chat/think-44.svg'

// 헤더(28px) · 말풍선(32px) · 첫 소개(56px) · 사진 찾는 중(44px) · 사진 못 알아봄(56px)
const VARIANTS = {
  header: { body: body28, face: agentFace28, box: 'size-7', inner: 'size-8.5 -top-0.5 -left-0.5' },
  agent: { body: body32, face: agentFace32, box: 'size-8', inner: 'size-9.5 -top-0.5 -left-0.5' },
  think: { body: body32, face: thinkFace32, box: 'size-8', inner: 'size-9.5 -top-0.5 -left-0.5' },
  sorry: { body: body32, face: sorryFace32, box: 'size-8', inner: 'size-9.5 -top-0.5 -left-0.5' },
  done: { body: body32, face: doneFace32, box: 'size-8', inner: 'size-9.5 -top-0.5 -left-0.5' },
  hello: { body: body56, face: helloFace56, box: 'size-14', inner: 'size-16.5 -top-0.5 -left-1.5' },
  thinkLg: { body: body44, face: thinkFace44, box: 'size-11', inner: 'size-13 -top-0.5 -left-1' },
  sorryLg: {
    body: body56,
    face: sorryFace56,
    box: 'size-14',
    inner: 'size-16.5 -top-0.5 -left-1.5',
  },
}

export type ChatAvatarVariant = keyof typeof VARIANTS

type ChatAvatarProps = {
  variant: ChatAvatarVariant
}

// Figma 「당당이 / 아바타」 챗봇용 원형. 위험 신호 안내에는 쓰지 않음
function ChatAvatar({ variant }: ChatAvatarProps) {
  const { body, face, box, inner } = VARIANTS[variant]
  return (
    <span
      aria-hidden
      className={`relative block shrink-0 overflow-hidden rounded-full bg-yellow-50 ${box}`}
    >
      <span className={`absolute ${inner}`}>
        <img src={body} alt="" className="absolute top-2/15 left-7/40 max-w-none" />
        <img src={face} alt="" className="absolute inset-0 max-w-none" />
      </span>
    </span>
  )
}

export default ChatAvatar
