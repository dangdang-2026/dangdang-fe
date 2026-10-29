import iconFixed from '@/assets/icons/chat/fixed.svg'
import iconPhone from '@/assets/icons/chat/phone.svg'
import iconPhoneWhite from '@/assets/icons/chat/phone-white.svg'
import ChatActionButton from '@/components/chat/ChatActionButton'
import { MOCK_HOSPITAL } from '@/mocks/hospital'

// Figma Q-07 위험 신호. AI 답변 없이 정해진 문구만, 아바타 없음
function RiskCard() {
  return (
    <>
      <p className="text-grey-600 flex items-center gap-1.5 text-xs leading-snug font-medium">
        <img src={iconFixed} alt="" width={16} height={16} />
        정해진 안내 · AI 답변이 아니에요
      </p>
      <section role="alert" className="flex flex-col gap-2.5 rounded-2xl bg-red-50 p-4.5">
        <h2 className="text-subtitle-1 text-grey-900">지금은 병원에 먼저 연락해 주세요</h2>
        <p className="text-grey-800 text-sm leading-relaxed">
          출혈, 태동이 줄어든 느낌, 심한 두통이나 복통이 있으면 기다리지 말고 다니는 병원이나
          분만실에 바로 연락하세요.
        </p>
        <div className="flex gap-2 pt-1">
          <ChatActionButton icon={iconPhoneWhite} primary href={`tel:${MOCK_HOSPITAL.phone}`}>
            {MOCK_HOSPITAL.name}에 전화
          </ChatActionButton>
          <ChatActionButton icon={iconPhone} href="tel:119">
            119
          </ChatActionButton>
        </div>
      </section>
    </>
  )
}

export default RiskCard
