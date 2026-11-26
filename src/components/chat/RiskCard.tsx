import iconFixed from '@/assets/icons/chat/fixed.svg'
import iconPhone from '@/assets/icons/chat/phone.svg'
import iconPhoneWhite from '@/assets/icons/chat/phone-white.svg'
import ChatActionButton from '@/components/chat/ChatActionButton'
import { usePrimaryHospital } from '@/hooks/usePrimaryHospital'
import type { ChatCallAction, ChatRisk } from '@/types/chat'

type RiskCardProps = {
  // 서버가 정한 안내 본문
  text: string
  actions: ChatCallAction[]
  // 서버가 약 용량 안내로 정한 답
  dose: boolean
  // 서버 위급 안내 틀. 예전 대화 줄은 없어 버튼 종류로 짐작
  risk?: ChatRisk | null
}

type RiskType = ChatRisk['type']

type Call = { action: ChatCallAction; label: string; tel: string; tone: keyof typeof BUTTON_TONE }

// 병원 말고 전화 버튼. 병원은 다니는 병원 번호
const CALLS: Record<Exclude<ChatCallAction, 'CALL_HOSPITAL'>, { label: string; tel: string }> = {
  CALL_119: { label: '119에 전화', tel: '119' },
  CALL_109: { label: '109 자살예방 상담에 전화', tel: '109' },
  CALL_1577_0199: { label: '1577-0199 정신건강 상담에 전화', tel: '15770199' },
  CALL_112: { label: '112에 신고', tel: '112' },
  CALL_1366: { label: '1366 여성긴급전화에 전화', tel: '1366' },
}

// CALLS에 직접 있는 전화 종류만. toString 같은 물려받은 속성은 빼고
const isKnownCall = (action: string): action is keyof typeof CALLS =>
  Object.prototype.hasOwnProperty.call(CALLS, action)

const CALL_BUTTON =
  'text-t6 flex h-12 items-center justify-center rounded-xl px-4 text-center font-bold'
const BUTTON_TONE = {
  primary: 'bg-primary text-white',
  grey: 'bg-grey-100 text-grey-900',
  danger: 'bg-red-500 text-white',
  outline: 'border border-red-500 bg-white text-red-700',
}

// 예전 대화 줄(risk 없음)만 쓰는 제목 · 빨간 줄. 109가 있으면 마음, 아니면 급한 증상
const LEGACY: Record<'URGENT' | 'MIND', { title: string; warning: string }> = {
  URGENT: {
    title: '지금은 병원에 먼저 연락해 주세요',
    warning: '피가 많이 나거나, 어지럽거나,\n의식이 흐려지면 바로 119',
  },
  MIND: { title: '혼자 견디지 않아도 돼요', warning: '나를 해칠 것 같거나 위급하면 바로 119' },
}

function NoticeLabel() {
  return (
    <p className="text-grey-600 flex items-center gap-1.5 text-xs leading-snug font-medium">
      <img src={iconFixed} alt="" width={16} height={16} />
      정해진 안내 · AI 답변이 아니에요
    </p>
  )
}

// 버튼 색. 급한 증상 · 저혈당은 병원 회색 · 119 빨강, 마음 · 폭력은 첫 상담 노랑 · 나머지 회색 · 119 빨간 테두리
function toneOf(type: RiskType, action: ChatCallAction, index: number): keyof typeof BUTTON_TONE {
  const medical = type === 'URGENT' || type === 'HYPO'
  if (action === 'CALL_119') return medical ? 'danger' : 'outline'
  if (medical) return 'grey'
  return index === 0 ? 'primary' : 'grey'
}

// Figma Q-07 급한 증상 · Q-07b 저혈당 · Q-07c 마음 · 폭력(112 · 1366)은 같은 틀. 아바타 없음, 약 용량은 지금 모양
function RiskCard({ text, actions, dose, risk }: RiskCardProps) {
  const hospital = usePrimaryHospital()

  if (dose) {
    // 병원 번호가 없거나 앱이 모르는 전화 종류면 빈 전화 링크 대신 빼 둠
    const doseCalls = actions
      .filter((action) => action === 'CALL_HOSPITAL' || isKnownCall(action))
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

  const type: RiskType = risk?.type ?? (actions.includes('CALL_109') ? 'MIND' : 'URGENT')
  const legacy = LEGACY[type === 'MIND' ? 'MIND' : 'URGENT']
  // 예전 줄: 병원 번호가 없으면 병원 연락 대신 바로 연락하라고
  const title =
    risk?.title ?? (type === 'URGENT' && !hospital.phone ? '지금 바로 연락해 주세요' : legacy.title)
  const warning = risk?.warning ?? legacy.warning
  // 서버가 준 순서대로. 예전 줄은 버튼 목록이 비어 있을 수 있어 예전처럼 정해진 버튼(119는 늘)
  const order: ChatCallAction[] = risk
    ? actions
    : type === 'MIND'
      ? ['CALL_109', 'CALL_1577_0199', 'CALL_119']
      : ['CALL_HOSPITAL', 'CALL_119']
  // 병원 번호가 없으면 병원 버튼, 앱이 모르는 전화 종류는 빼고 남은 순서로 색을 정함
  const calls = order
    .flatMap((action): Omit<Call, 'tone'>[] => {
      if (action === 'CALL_HOSPITAL') {
        if (!hospital.phone) return []
        const label = `${hospital.name}${type === 'URGENT' ? ' 분만실' : ''}에 전화`
        return [{ action, label, tel: hospital.phone }]
      }
      return isKnownCall(action) ? [{ action, ...CALLS[action] }] : []
    })
    .map((call, index): Call => ({ ...call, tone: toneOf(type, call.action, index) }))

  return (
    <>
      <NoticeLabel />
      <section
        role="alert"
        className="rounded-banner border-red-150 flex flex-col gap-2 border bg-white p-5"
      >
        <h2 className="text-grey-900 text-base leading-normal font-bold whitespace-pre-line">
          {title}
        </h2>
        <p className="text-grey-700 text-sm leading-normal whitespace-pre-line">{text}</p>
        <p className="text-sm leading-normal font-medium whitespace-pre-line text-red-700">
          {warning}
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {calls.map((call) => (
            <a
              key={call.action}
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
