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
  // 서버가 약 용량 안내로 정한 답
  dose: boolean
}

// 약 용량 전화 버튼. 병원은 다니는 병원 번호
const CALLS: Record<Exclude<ChatCallAction, 'CALL_HOSPITAL'>, { label: string; tel: string }> = {
  CALL_119: { label: '119', tel: '119' },
  CALL_109: { label: '109 자살예방 상담', tel: '109' },
  CALL_1577_0199: { label: '1577-0199 정신건강 상담', tel: '15770199' },
}

const CALL_BUTTON =
  'text-t6 flex h-12 items-center justify-center rounded-xl px-4 text-center font-bold'
const BUTTON_TONE = {
  primary: 'bg-primary text-white',
  grey: 'bg-grey-100 text-grey-900',
  danger: 'bg-red-500 text-white',
  outline: 'border border-red-500 bg-white text-red-700',
}

type Call = { label: string; tel: string; tone: keyof typeof BUTTON_TONE }

// 약 용량은 서버 dose 값, 그 밖은 버튼 종류로 나눔: 109면 마음, 아니면 위급
function getRiskKind(actions: ChatCallAction[], dose: boolean) {
  if (dose) return 'dose'
  if (actions.includes('CALL_109')) return 'mind'
  return 'urgent'
}

function NoticeLabel() {
  return (
    <p className="text-grey-600 flex items-center gap-1.5 text-xs leading-snug font-medium">
      <img src={iconFixed} alt="" width={16} height={16} />
      정해진 안내 · AI 답변이 아니에요
    </p>
  )
}

// Figma Q-07 위험 신호(산과) · Q-07c(마음)는 서버 문구만 · 아바타 없음, 약 용량은 지금 모양
function RiskCard({ text, actions, dose }: RiskCardProps) {
  const hospital = usePrimaryHospital()
  const kind = getRiskKind(actions, dose)

  if (kind === 'dose') {
    // 병원 번호가 없으면 빈 전화 링크 대신 빼 둠
    const doseCalls = actions
      .map((action) => ({
        action,
        ...(action === 'CALL_HOSPITAL'
          ? { label: `${hospital.name}에 전화`, tel: hospital.phone }
          : CALLS[action]),
      }))
      .filter((call) => !!call.tel)
    return (
      <>
        <NoticeLabel />
        <section role="alert" className="flex flex-col gap-2.5 rounded-2xl bg-red-50 p-4.5">
          <p className="text-grey-800 text-sm leading-relaxed">{text}</p>
          {doseCalls.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {doseCalls.map((call, index) => (
                <ChatActionButton
                  key={call.action}
                  icon={index === 0 ? iconPhoneWhite : iconPhone}
                  primary={index === 0}
                  href={`tel:${call.tel}`}
                >
                  {call.label}
                </ChatActionButton>
              ))}
            </div>
          )}
        </section>
      </>
    )
  }

  // 마음: 상담 전화 먼저, 위급하면 119 / 위급: 병원 분만실 · 119, 병원 번호가 없으면 119만
  const hasHospital = !!hospital.phone
  // 병원 번호가 없을 땐 서버 문구(병원 연락)와 어긋나지 않게 제목은 연락만 권함
  const title =
    kind === 'mind'
      ? '혼자 견디지 않아도 돼요'
      : hasHospital
        ? '지금은 병원에 먼저 연락해 주세요'
        : '지금 바로 연락해 주세요'
  const warning =
    kind === 'mind'
      ? '나를 해칠 것 같거나 위급하면 바로 119'
      : '피가 많이 나거나, 어지럽거나,\n의식이 흐려지면 바로 119'
  const calls: Call[] =
    kind === 'mind'
      ? [
          { label: '109 자살예방 상담에 전화', tel: '109', tone: 'primary' },
          { label: '1577-0199 정신건강 상담에 전화', tel: '15770199', tone: 'grey' },
          { label: '119에 전화', tel: '119', tone: 'outline' },
        ]
      : [
          ...(hasHospital
            ? [
                {
                  label: `${hospital.name} 분만실에 전화`,
                  tel: hospital.phone,
                  tone: 'grey',
                } as const,
              ]
            : []),
          { label: '119에 전화', tel: '119', tone: 'danger' },
        ]

  return (
    <>
      <NoticeLabel />
      <section
        role="alert"
        className="rounded-banner border-red-150 flex flex-col gap-2 border bg-white p-5"
      >
        <h2 className="text-grey-900 text-base leading-normal font-bold">{title}</h2>
        <p className="text-grey-700 text-sm leading-normal">{text}</p>
        <p className="text-sm leading-normal font-medium whitespace-pre-line text-red-700">
          {warning}
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {calls.map((call) => (
            <a
              key={call.tel}
              href={`tel:${call.tel}`}
              className={`${CALL_BUTTON} ${BUTTON_TONE[call.tone]}`}
            >
              {call.label}
            </a>
          ))}
        </div>
      </section>
    </>
  )
}

export default RiskCard
