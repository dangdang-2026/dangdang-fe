import iconFixed from '@/assets/icons/chat/fixed.svg'
import iconPhone from '@/assets/icons/chat/phone.svg'
import iconPhoneWhite from '@/assets/icons/chat/phone-white.svg'
import ChatActionButton from '@/components/chat/ChatActionButton'
import { usePrimaryHospital } from '@/hooks/usePrimaryHospital'
import type { ChatCallAction } from '@/types/chat'

type RiskCardProps = {
  // 서버가 정한 안내 문구
  text: string
  actions: ChatCallAction[]
}

// 위험 신호 · 약 용량 전화 버튼. 병원은 다니는 병원 번호
const CALLS: Record<Exclude<ChatCallAction, 'CALL_HOSPITAL'>, { label: string; tel: string }> = {
  CALL_119: { label: '119', tel: '119' },
  CALL_109: { label: '109 자살예방 상담', tel: '109' },
  CALL_1577_0199: { label: '1577-0199 정신건강 상담', tel: '15770199' },
}

// Figma Q-07 위험 신호. AI 답변 없이 서버의 정해진 문구만, 아바타 없음
function RiskCard({ text, actions }: RiskCardProps) {
  const hospital = usePrimaryHospital()
  // 급한 증상(병원 · 119)일 때만 Figma 제목
  const urgent = actions.includes('CALL_HOSPITAL') && actions.includes('CALL_119')

  return (
    <>
      <p className="text-grey-600 flex items-center gap-1.5 text-xs leading-snug font-medium">
        <img src={iconFixed} alt="" width={16} height={16} />
        정해진 안내 · AI 답변이 아니에요
      </p>
      <section role="alert" className="flex flex-col gap-2.5 rounded-2xl bg-red-50 p-4.5">
        {urgent && (
          <h2 className="text-subtitle-1 text-grey-900">지금은 병원에 먼저 연락해 주세요</h2>
        )}
        <p className="text-grey-800 text-sm leading-relaxed">{text}</p>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {actions.map((action, index) => {
              const call =
                action === 'CALL_HOSPITAL'
                  ? { label: `${hospital.name}에 전화`, tel: hospital.phone }
                  : CALLS[action]
              if (!call) return null
              return (
                <ChatActionButton
                  key={action}
                  icon={index === 0 ? iconPhoneWhite : iconPhone}
                  primary={index === 0}
                  href={`tel:${call.tel}`}
                >
                  {call.label}
                </ChatActionButton>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}

export default RiskCard
