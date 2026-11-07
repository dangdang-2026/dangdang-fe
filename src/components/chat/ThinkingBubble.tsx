import iconDots from '@/assets/icons/chat/dots.svg'
import BotMessage from '@/components/chat/BotMessage'

type ThinkingBubbleProps = {
  label: string
}

// Figma Q-03a 생각 중: 점 세 개 + 찾는 중 문구
function ThinkingBubble({ label }: ThinkingBubbleProps) {
  return (
    <BotMessage avatar="think">
      <p
        role="status"
        className="bg-grey-50 rounded-bubble text-grey-700 flex items-center gap-2.5 rounded-tl-sm px-3.5 py-2.5 text-sm leading-normal font-medium"
      >
        <img src={iconDots} alt="" width={26} height={6} className="animate-pulse" />
        {label}
      </p>
    </BotMessage>
  )
}

export default ThinkingBubble
